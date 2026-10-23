// Runs the data server and the Vite dev server together, and stops both together.
import { spawn, type ChildProcess } from 'node:child_process';

const children: ChildProcess[] = [
  spawn(process.execPath, ['--watch', 'server/index.ts'], { stdio: 'inherit', env: { ...process.env, PORT: '3001' } }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--port', '3000'], { stdio: 'inherit' }),
];

const stop = () => {
  for (const c of children) c.kill('SIGTERM');
  process.exit(0);
};
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sig, stop);
for (const c of children) c.on('exit', (code) => code && stop());
