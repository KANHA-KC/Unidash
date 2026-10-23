import { DataSource } from '../types/dashboard';

export const initialDataSources: DataSource[] = [
  {
    id: 'source-stripe',
    name: 'Stripe Billing API',
    type: 'rest',
    status: 'connected',
    lastSync: 'Just now',
    refreshIntervalSec: 5,
    endpointUrl: 'https://api.stripe.com/v1/metrics/live',
    data: {
      mrr: 84250,
      arr: 1011000,
      churnRate: 1.18,
      netRetention: 114,
      payingCustomers: 1420,
    },
  },
  {
    id: 'source-analytics',
    name: 'Product Telemetry & Traffic',
    type: 'realtime',
    status: 'connected',
    lastSync: '2s ago',
    refreshIntervalSec: 3,
    endpointUrl: 'wss://telemetry.unidash.io/v1/stream',
    data: {
      activeSessions: 3840,
      requestsPerSec: 4890,
      avgLatencyMs: 38.4,
      errorRate: 0.02,
      uptime: 99.98,
    },
  },
  {
    id: 'source-csv-crm',
    name: 'Q3 Enterprise Pipeline.csv',
    type: 'csv',
    status: 'connected',
    lastSync: '10m ago',
    refreshIntervalSec: 60,
    data: {
      deals: [
        { client: 'Acme Corp', tier: 'Enterprise Plus', value: 34000, status: 'Active', renewal: 'Nov 2026' },
        { client: 'Linear Systems', tier: 'Scale Pro', value: 18500, status: 'Active', renewal: 'Dec 2026' },
        { client: 'Vercel Labs', tier: 'Enterprise Plus', value: 42000, status: 'Review', renewal: 'Jan 2027' },
        { client: 'Retool Global', tier: 'Growth', value: 12000, status: 'Active', renewal: 'Feb 2027' },
        { client: 'Supabase Cloud', tier: 'Enterprise Plus', value: 28000, status: 'Active', renewal: 'Mar 2027' },
      ],
    },
  },
];
