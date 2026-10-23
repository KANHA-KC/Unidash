// AI prompt-to-dashboard generation and AI edits (blueprint §9, addendum §2.2).
// Generation uses the most capable model with the full widget catalog. Edits send only the
// selected widget (or a compact outline for layout changes) to a fast, cheap model.
// Model output is never trusted: shared/ai.ts validates and repairs it before it is returned.

import Anthropic from '@anthropic-ai/sdk';
import { UserError } from './sources.ts';
import {
  MAX_WIDGETS,
  WIDGET_SPECS,
  dashboardJsonSchema,
  sanitizeDashboard,
  sanitizeOps,
  widgetCatalog,
  type DraftDashboard,
  type EditOp,
} from '../shared/ai.ts';
import type { WidgetType } from '../src/types.ts';

const GENERATE_MODEL = 'claude-opus-5-5';
const EDIT_MODEL = 'claude-haiku-5-5';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new UserError('AI isn’t set up on this server. Set ANTHROPIC_API_KEY and restart Unidash.', 503);
  }
  client ??= new Anthropic({ timeout: 120_000, maxRetries: 1 });
  return client;
}

/** Token usage per request goes to the server log (Phase 6 meters it per workspace). */
function logUsage(kind: string, model: string, started: number, usage: Anthropic.Usage | Anthropic.Beta.BetaUsage | undefined) {
  if (!usage) return;
  console.log(
    `[ai] ${kind} model=${model} in=${usage.input_tokens} out=${usage.output_tokens}` +
      ` cache_read=${usage.cache_read_input_tokens ?? 0} cache_write=${usage.cache_creation_input_tokens ?? 0}` +
      ` ms=${Date.now() - started}`,
  );
}

function textOf(content: (Anthropic.ContentBlock | Anthropic.Beta.BetaContentBlock)[]): string {
  return content.map((b) => (b.type === 'text' ? b.text : '')).join('');
}

/** Pull the first JSON object out of a reply (used when structured output isn't available). */
function parseJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new UserError('The AI reply wasn’t a dashboard. Try rephrasing.', 502);
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new UserError('The AI reply wasn’t valid. Try again.', 502);
  }
}

/** Map SDK errors to messages a person can act on. */
function apiFailure(err: unknown): never {
  if (err instanceof UserError) throw err;
  if (err instanceof Anthropic.AuthenticationError) throw new UserError('The ANTHROPIC_API_KEY on this server was rejected.', 503);
  if (err instanceof Anthropic.RateLimitError) throw new UserError('The AI is busy right now. Try again in a minute.', 429);
  if (err instanceof Anthropic.APIConnectionError) throw new UserError('Couldn’t reach the AI service. Check the server’s internet connection.', 502);
  if (err instanceof Anthropic.APIError) {
    console.error(`[ai] API error ${err.status}:`, err.message);
    throw new UserError('The AI request failed. Try again.', 502);
  }
  throw err;
}

const GENERATE_SYSTEM = `You design personal and business dashboards for Unidash, a minimal dashboard builder.
Given what the user wants to track, return one dashboard as JSON.

Widget types (use only these, with exactly these data fields):
${widgetCatalog()}

Sizes: "sm" is a quarter of the desktop width, "md" half, "lg" three quarters, "full" the whole row. Phones show two columns, so order matters more than size.

Guidance:
- 5 to 10 widgets that together answer "how am I doing?" at a glance. Put the 2–4 most important numbers first as small stat or progress widgets, then charts, then lists and notes. Use a heading only to separate clearly different groups.
- Values are realistic examples the user will replace, so keep them plausible and internally consistent (a goal's value below its target, chart labels in order, 5–8 points per chart).
- Titles are short (1–4 words), sentence case, no emoji. Put units in prefix/suffix (e.g. suffix " km"), not in titles.
- Checklists hold concrete next steps. Countdowns use future dates after ${'{TODAY}'}.
- Do not invent links or image URLs; leave url fields "" and omit links/image widgets unless the user asks.
- name: 1–4 words. emoji: a single emoji. accent: one of the listed colors that suits the topic.
- At most ${MAX_WIDGETS} widgets.`;

export async function generateDashboard(input: unknown): Promise<DraftDashboard> {
  const prompt = typeof (input as any)?.prompt === 'string' ? (input as any).prompt.trim().slice(0, 1000) : '';
  if (!prompt) throw new UserError('Describe what you want to build');
  const ai = getClient();
  const today = new Date().toISOString().slice(0, 10);
  const system = GENERATE_SYSTEM.replace('{TODAY}', today);
  const started = Date.now();

  const request = (structured: boolean) =>
    ai.beta.messages.create({
      model: GENERATE_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      output_config: {
        effort: 'medium',
        ...(structured ? { format: { type: 'json_schema' as const, schema: dashboardJsonSchema() } } : {}),
      },
      messages: [
        {
          role: 'user',
          content: structured ? prompt : `${prompt}\n\nReply with only the JSON object: { "name", "emoji", "accent", "widgets": [{ "type", "title", "size", "data" }] }.`,
        },
      ],
    });

  let res: Anthropic.Beta.BetaMessage;
  try {
    try {
      res = await request(true);
    } catch (err) {
      // If the schema is ever rejected (e.g. too complex), fall back to prompt-guided JSON; we validate either way.
      if (!(err instanceof Anthropic.BadRequestError)) throw err;
      console.warn('[ai] structured output rejected, retrying without schema:', err.message);
      res = await request(false);
    }
  } catch (err) {
    apiFailure(err);
  }
  logUsage('generate', res.model, started, res.usage);
  if (res.stop_reason === 'refusal') throw new UserError('The AI couldn’t help with that one. Try describing it differently.', 422);
  if (res.stop_reason === 'max_tokens') throw new UserError('That dashboard came out too big. Try something more focused.', 502);
  try {
    return sanitizeDashboard(parseJson(textOf(res.content)));
  } catch (err) {
    if (err instanceof UserError) throw err;
    throw new UserError('The AI didn’t return a usable dashboard. Try rephrasing.', 502);
  }
}

const EDIT_SYSTEM = `You edit dashboards in Unidash by returning typed operations as JSON.

Widget types and their data fields:
${widgetCatalog()}

Reply with only a JSON object: { "ops": [...], "summary": "<at most 8 words, past tense, e.g. Changed the target to 42 km>" }
Operations:
- { "op": "update_props", "id": "<widget id>", "title"?: string, "size"?: "sm"|"md"|"lg"|"full", "data"?: { only the fields to change } }
- { "op": "add_component", "widget": { "type", "title", "size", "data" }, "index"?: position (0 = first; omit to add at the end) }
- { "op": "move_component", "id": "<widget id>", "index": new position (0 = first) }
- { "op": "remove_component", "id": "<widget id>" }

Rules: use only widget ids you were given. Change only what the instruction asks for. Arrays (points, items, rows, links, trend) are replaced whole, so send the full new array. If the instruction can't be done with these operations, return { "ops": [], "summary": "<why, briefly>" }.`;

interface EditInput {
  instruction?: unknown;
  /** The selected widget's full JSON (scoped edit). */
  widget?: { id?: unknown; type?: unknown; title?: unknown; size?: unknown; data?: unknown };
  /** Compact outline of the dashboard (layout edit). */
  outline?: { id?: unknown; type?: unknown; title?: unknown; size?: unknown }[];
}

const isType = (t: unknown): t is WidgetType => typeof t === 'string' && t in WIDGET_SPECS;

export async function editDashboard(input: EditInput): Promise<{ ops: EditOp[]; summary: string }> {
  const instruction = typeof input?.instruction === 'string' ? input.instruction.trim().slice(0, 500) : '';
  if (!instruction) throw new UserError('Say what to change');

  // Only ids the model was shown may be edited.
  const types = new Map<string, WidgetType>();
  let context: string;
  if (input.widget && typeof input.widget.id === 'string' && isType(input.widget.type)) {
    const w = input.widget;
    types.set(w.id as string, w.type as WidgetType);
    context = `The selected widget:\n${JSON.stringify({ id: w.id, type: w.type, title: w.title, size: w.size, data: w.data }).slice(0, 12_000)}`;
  } else if (Array.isArray(input.outline)) {
    const outline = input.outline.slice(0, MAX_WIDGETS * 2).filter((w) => typeof w?.id === 'string' && isType(w.type));
    for (const w of outline) types.set(w.id as string, w.type as WidgetType);
    context = `The dashboard, in order (index: id type size "title"):\n${outline
      .map((w, i) => `${i}: ${w.id} ${w.type} ${w.size} ${JSON.stringify(String(w.title ?? '').slice(0, 80))}`)
      .join('\n') || '(empty)'}`;
  } else {
    throw new UserError('Nothing to edit');
  }

  const ai = getClient();
  const started = Date.now();
  let res: Anthropic.Message;
  try {
    res = await ai.messages.create({
      model: EDIT_MODEL,
      max_tokens: 4000,
      system: [{ type: 'text', text: EDIT_SYSTEM, cache_control: { type: 'ephemeral' } }],
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: `${context}\n\nInstruction: ${instruction}` }],
    });
  } catch (err) {
    apiFailure(err);
  }
  logUsage('edit', res.model, started, res.usage);
  if (res.stop_reason === 'refusal') throw new UserError('The AI couldn’t help with that one.', 422);
  const raw = parseJson(textOf(res.content)) as { summary?: unknown };
  const ops = sanitizeOps(raw, new Set(types.keys()), types);
  const summary = typeof raw?.summary === 'string' ? raw.summary.slice(0, 120) : '';
  return { ops, summary };
}
