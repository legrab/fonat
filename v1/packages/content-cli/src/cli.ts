#!/usr/bin/env node
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import archiver from 'archiver';
import { Command } from 'commander';
import { validateDirectory } from './index.js';

const program = new Command();
program.name('fonat-content').description('Validate and package Fonat content repositories.');
program
  .command('validate')
  .argument('[directory]', 'package directory', '.')
  .action(async (directory: string) => {
    const result = await validateDirectory(path.resolve(directory));
    for (const issue of result.issues)
      console.log(`${issue.severity.toUpperCase()} ${issue.code}: ${issue.message}`);
    if (!result.valid) process.exitCode = 1;
    else console.log('Valid Fonat content package.');
  });
program
  .command('test')
  .argument('[directory]', 'package directory', '.')
  .action(async (directory: string) => {
    const result = await validateDirectory(path.resolve(directory));
    if (!result.valid) process.exitCode = 1;
    else console.log('Content tests passed (schema, relations, translations, rights).');
  });
program
  .command('pack')
  .argument('[directory]', 'package directory', '.')
  .option('-o, --output <file>', 'output zip file')
  .action(async (directory: string, options: { output?: string }) => {
    const source = path.resolve(directory);
    const validation = await validateDirectory(source);
    if (!validation.valid) throw new Error('Package is invalid. Run validate first.');
    const output = path.resolve(options.output ?? `${path.basename(source)}.zip`);
    const stream = createWriteStream(output);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(stream);
    archive.directory(source, false);
    await archive.finalize();
    console.log(output);
  });
await program.parseAsync();
