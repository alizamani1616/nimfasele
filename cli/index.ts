#!/usr/bin/env node
/**
 * nimfasele CLI — نیم‌فاصله‌گذار خودکار متن فارسی.
 *
 * Usage: nimfasele [file|-] [options]
 *   -w, --write        rewrite the input file in place
 *   --check            exit with code 1 when issues are found (no output text)
 *   --report           list issues with file, line and column
 *   --no-normalize     skip character normalization
 *   --no-compounds     skip the compound-word dictionary
 *   -h, --help         show this help
 *   -v, --version      show version
 *
 * Exit codes: 0 = success / no issues, 1 = issues found (with --check),
 * 2 = usage or IO error.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { fixHalfSpace, findHalfSpaceIssues } from '../src/index.js';
import type { FixOptions, HalfSpaceIssue } from '../src/index.js';
import pkg from '../package.json' with { type: 'json' };

export type CliOptions = {
  files: string[];
  write: boolean;
  check: boolean;
  report: boolean;
  normalize: boolean;
  compounds: boolean;
  help: boolean;
  version: boolean;
};

const USAGE = `nimfasele — نیم‌فاصله‌گذار خودکار متن فارسی

Usage:
  nimfasele <file>          print the fixed text
  nimfasele -               read from stdin, print the fixed text
  cat file | nimfasele      same as above
  nimfasele <file> -w       rewrite the file in place
  nimfasele <file> --check  exit 1 when half-space issues exist
  nimfasele <file> --report list issues with line and column

Options:
  -w, --write        rewrite the input file in place
  --check            exit with code 1 when issues are found
  --report           list issues with file, line and column
  --no-normalize     skip character normalization
  --no-compounds     skip the compound-word dictionary
  -h, --help         show this help
  -v, --version      show version`;

export function parseArgs(argv: readonly string[]): {
  options: CliOptions | null;
  error?: string;
} {
  const options: CliOptions = {
    files: [],
    write: false,
    check: false,
    report: false,
    normalize: true,
    compounds: true,
    help: false,
    version: false,
  };
  let noMoreFlags = false;
  for (const arg of argv) {
    if (!noMoreFlags && arg === '--') {
      noMoreFlags = true;
      continue;
    }
    if (!noMoreFlags && arg.startsWith('-') && arg !== '-') {
      switch (arg) {
        case '-w':
        case '--write':
          options.write = true;
          break;
        case '--check':
          options.check = true;
          break;
        case '--report':
          options.report = true;
          break;
        case '--no-normalize':
          options.normalize = false;
          break;
        case '--no-compounds':
          options.compounds = false;
          break;
        case '-h':
        case '--help':
          options.help = true;
          break;
        case '-v':
        case '--version':
          options.version = true;
          break;
        default:
          return { options: null, error: `unknown option: ${arg}` };
      }
      continue;
    }
    options.files.push(arg);
  }
  return { options };
}

/** Convert a string offset to a 1-based line and column. */
export function offsetToLineCol(
  text: string,
  offset: number,
): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}

/** Read a whole UTF-8 stream (used for stdin). */
export function readStdinFrom(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

/** Injectable process edges for testing. */
export type Io = {
  stderr: (s: string) => void;
  stdout: (s: string) => void;
  stdin: () => Promise<string>;
  isTTY: () => boolean;
};

export const defaultIo: Io = {
  stderr: (s) => process.stderr.write(s),
  stdout: (s) => process.stdout.write(s),
  stdin: () => readStdinFrom(process.stdin),
  isTTY: () => process.stdin.isTTY === true,
};

export function fixOptionsOf(options: CliOptions): FixOptions {
  return { normalize: options.normalize, compounds: options.compounds };
}

function formatIssue(label: string, text: string, issue: HalfSpaceIssue): string {
  const { line, column } = offsetToLineCol(text, issue.start);
  const original = JSON.stringify(issue.original);
  const suggestion = JSON.stringify(issue.suggestion);
  return `${label}:${line}:${column} [${issue.rule}] ${original} → ${suggestion}`;
}

export async function run(options: CliOptions, io: Io = defaultIo): Promise<number> {
  const fixOptions = fixOptionsOf(options);
  let exitCode = 0;

  const inputs: Array<{
    label: string;
    read: () => Promise<string>;
    write?: (text: string) => void;
  }> = [];
  for (const file of options.files) {
    if (file === '-') {
      inputs.push({ label: '<stdin>', read: io.stdin });
    } else {
      inputs.push({
        label: file,
        read: async () => readFileSync(file, 'utf8'),
        write: options.write ? (text) => writeFileSync(file, text, 'utf8') : undefined,
      });
    }
  }
  if (inputs.length === 0) {
    if (io.isTTY()) {
      io.stderr(`${USAGE}\n\nerror: no input file and stdin is a terminal\n`);
      return 2;
    }
    inputs.push({ label: '<stdin>', read: io.stdin });
  }

  for (const input of inputs) {
    let text: string;
    try {
      text = await input.read();
    } catch (error) {
      io.stderr(`nimfasele: cannot read ${input.label}: ${(error as Error).message}\n`);
      exitCode = 2;
      continue;
    }

    const issues = findHalfSpaceIssues(text, fixOptions);

    if (options.report) {
      for (const issue of issues) {
        io.stderr(`${formatIssue(input.label, text, issue)}\n`);
      }
    }

    if (options.check) {
      if (issues.length > 0) {
        io.stderr(
          `nimfasele: ${input.label}: ${issues.length} half-space issue${issues.length === 1 ? '' : 's'} found\n`,
        );
        exitCode = 1;
      }
      continue;
    }

    const fixed = fixHalfSpace(text, fixOptions);
    if (input.write) {
      input.write(fixed);
    } else {
      io.stdout(fixed);
    }
  }

  return exitCode;
}

/** Entry point; `argv` defaults to the process arguments. */
export async function main(
  argv: readonly string[] = process.argv.slice(2),
): Promise<void> {
  const { options, error } = parseArgs(argv);
  if (options === null) {
    process.stderr.write(`${USAGE}\n\nerror: ${error}\n`);
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }
  if (options.version) {
    process.stdout.write(`${pkg.version}\n`);
    return;
  }
  process.exitCode = await run(options);
}

const invoked =
  process.argv[1] !== undefined ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invoked) {
  await main();
}
