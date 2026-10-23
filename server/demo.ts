import type { DemoKind, Row } from '../shared/data.ts';
import { TIME_FIELD } from '../shared/data.ts';

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

/** One simulated record for a demo stream at time `t`. */
export function demoRow(kind: DemoKind, t: number): Row {
  const time = new Date(t).toISOString();
  switch (kind) {
    case 'store': {
      const orders = 1 + Math.floor(Math.random() * 9);
      const avg = 35 + Math.random() * 45;
      return {
        [TIME_FIELD]: time,
        orders,
        revenue: round(orders * avg, 2),
        avg_order: round(avg, 2),
        region: pick(['North America', 'Europe', 'Asia', 'Europe', 'North America', 'South America']),
        channel: pick(['Web', 'Web', 'Mobile app', 'Marketplace']),
      };
    }
    case 'api': {
      const spike = Math.random() < 0.08;
      const latency = round(spike ? 400 + Math.random() * 500 : 90 + Math.random() * 60);
      return {
        [TIME_FIELD]: time,
        latency_ms: latency,
        requests: 180 + Math.floor(Math.random() * 220),
        errors: spike ? 3 + Math.floor(Math.random() * 6) : Math.floor(Math.random() * 2),
        endpoint: pick(['/checkout', '/search', '/login', '/search', '/products']),
        status: spike ? 'degraded' : 'ok',
      };
    }
    case 'automation': {
      const status = pick(['success', 'success', 'success', 'success', 'failed', 'running']);
      return {
        execution_date: time,
        workflow: pick(['Lead enrichment', 'Invoice parser', 'Support triage', 'Weekly report']),
        status,
        hours_saved: status === 'success' ? round(0.2 + Math.random() * 1.6, 1) : 0,
        cost_usd: round(0.01 + Math.random() * 0.12, 3),
      };
    }
  }
}

/** A plausible recent history so a new demo source looks alive immediately. */
export function demoHistory(kind: DemoKind, count = 40, stepMs = 5000): Row[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => demoRow(kind, now - (count - i) * stepMs));
}

export const DEMO_TICK_MS = 4000;
