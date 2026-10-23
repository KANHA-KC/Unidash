import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
/** Set UNIDASH_ALLOW_PRIVATE=1 to let REST sources reach localhost / LAN addresses (e.g. a local n8n). */
const ALLOW_PRIVATE = process.env.UNIDASH_ALLOW_PRIVATE === '1';

function isPrivateV4(ip: string) {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  );
}

function isPrivate(ip: string) {
  if (isIP(ip) === 4) return isPrivateV4(ip);
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateV4(v6.slice(7));
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
}

/** Reject URLs that are not http(s) or that resolve to internal addresses (SSRF guard). */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('That doesn’t look like a valid URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only http and https URLs are supported');
  if (url.username || url.password) throw new Error('Put credentials in headers, not in the URL');
  if (ALLOW_PRIVATE) return url;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  if (!addresses.length || addresses.some(isPrivate)) {
    throw new Error('This address points to a private network and is blocked for safety');
  }
  return url;
}

/** GET a JSON (or CSV) endpoint with a timeout, a size cap and re-validated redirects. */
export async function safeFetch(rawUrl: string, headers: Record<string, string>): Promise<{ body: unknown; contentType: string }> {
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url, {
      headers: { accept: 'application/json, text/csv;q=0.9, */*;q=0.5', 'user-agent': 'Unidash/1.0', ...headers },
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      current = new URL(res.headers.get('location')!, url).toString();
      continue;
    }
    if (!res.ok) throw new Error(`The API answered ${res.status} ${res.statusText}`.trim());
    const text = await readCapped(res);
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('csv')) return { body: text, contentType };
    try {
      return { body: JSON.parse(text), contentType };
    } catch {
      throw new Error('The response isn’t valid JSON');
    }
  }
  throw new Error('Too many redirects');
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new Error('The response is larger than 2 MB');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
