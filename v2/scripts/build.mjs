import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

console.log('> Generate capability module registry');
const generate = spawn(process.execPath, [path.join(root, 'scripts/generate-module-registry.mjs')], {
  cwd: root,
  stdio: 'inherit'
});
await new Promise((resolve, reject) => {
  generate.on('error', reject);
  generate.on('close', (code) =>
    code === 0 ? resolve() : reject(new Error(`Module registry generation failed with ${code}`))
  );
});

console.log('> TypeScript backend and shared packages');
const child = spawn(process.execPath, [tsc, '-b', 'tsconfig.backend.json', '--force'], {
  cwd: root,
  stdio: 'inherit'
});
child.on('error', (error) => {
  throw error;
});
child.on('close', (code) => process.exit(code ?? 1));
