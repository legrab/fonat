import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

console.log('> TypeScript backend and shared packages');
const child = spawn(process.execPath, [tsc, '-b', 'tsconfig.backend.json', '--force'], {
  cwd: root,
  stdio: 'inherit'
});
child.on('error', (error) => {
  throw error;
});
child.on('close', (code) => process.exit(code ?? 1));
