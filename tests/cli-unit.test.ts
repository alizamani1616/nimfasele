import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  fixOptionsOf,
  main,
  offsetToLineCol,
  parseArgs,
  run,
  type Io,
  type CliOptions,
} from '../cli/index.js';

const workdir = mkdtempSync(join(tmpdir(), 'nimfasele-cli-unit-'));
afterAll(() => {
  rmSync(workdir, { recursive: true, force: true });
});

function stubIo(stdout: string[] = [], stderr: string[] = [], stdinText = ''): Io {
  return {
    stdout: (s) => stdout.push(s),
    stderr: (s) => stderr.push(s),
    stdin: async () => stdinText,
    isTTY: () => false,
  };
}

const baseOptions: CliOptions = {
  files: [],
  write: false,
  check: false,
  report: false,
  normalize: true,
  compounds: true,
  help: false,
  version: false,
};

describe('parseArgs', () => {
  it('parses every flag', () => {
    const { options } = parseArgs([
      '-w',
      '--check',
      '--report',
      '--no-normalize',
      '--no-compounds',
      'f1.txt',
      'f2.txt',
    ]);
    expect(options).toEqual({
      files: ['f1.txt', 'f2.txt'],
      write: true,
      check: true,
      report: true,
      normalize: false,
      compounds: false,
      help: false,
      version: false,
    });
  });

  it('parses long write and short help/version', () => {
    expect(parseArgs(['--write']).options?.write).toBe(true);
    expect(parseArgs(['-h']).options?.help).toBe(true);
    expect(parseArgs(['-v']).options?.version).toBe(true);
  });

  it('treats "-" as a file, not a flag', () => {
    expect(parseArgs(['-']).options?.files).toEqual(['-']);
  });

  it('supports -- to end flag parsing', () => {
    const { options } = parseArgs(['--', '--weird', '-w']);
    expect(options?.files).toEqual(['--weird', '-w']);
    expect(options?.write).toBe(false);
  });

  it('rejects unknown options with an error', () => {
    const { options, error } = parseArgs(['--bogus']);
    expect(options).toBeNull();
    expect(error).toBe('unknown option: --bogus');
  });

  it('returns defaults for empty argv', () => {
    const { options, error } = parseArgs([]);
    expect(error).toBeUndefined();
    expect(options).toEqual(baseOptions);
  });
});

describe('offsetToLineCol', () => {
  it('computes 1-based line and column', () => {
    const text = 'ab\ncde\nf';
    expect(offsetToLineCol(text, 0)).toEqual({ line: 1, column: 1 });
    expect(offsetToLineCol(text, 3)).toEqual({ line: 2, column: 1 });
    expect(offsetToLineCol(text, 5)).toEqual({ line: 2, column: 3 });
    expect(offsetToLineCol(text, 7)).toEqual({ line: 3, column: 1 });
    // offset 8 = just past the end → column 2 of line 3
    expect(offsetToLineCol(text, 8)).toEqual({ line: 3, column: 2 });
  });
});

describe('fixOptionsOf', () => {
  it('maps CLI flags to FixOptions', () => {
    expect(fixOptionsOf(baseOptions)).toEqual({ normalize: true, compounds: true });
    expect(
      fixOptionsOf({ ...baseOptions, normalize: false, compounds: false }),
    ).toEqual({ normalize: false, compounds: false });
  });
});

describe('run (unit, injected IO)', () => {
  it('fixes a file to stdout', async () => {
    const file = join(workdir, 'u1.txt');
    writeFileSync(file, 'کتاب ها', 'utf8');
    const stdout: string[] = [];
    const code = await run({ ...baseOptions, files: [file] }, stubIo(stdout));
    expect(code).toBe(0);
    expect(stdout.join('')).toBe('کتاب‌ها');
  });

  it('writes in place with -w and prints nothing', async () => {
    const file = join(workdir, 'u2.txt');
    writeFileSync(file, 'می روم', 'utf8');
    const stdout: string[] = [];
    const code = await run(
      { ...baseOptions, files: [file], write: true },
      stubIo(stdout),
    );
    expect(code).toBe(0);
    expect(stdout).toEqual([]);
    expect(readFileSync(file, 'utf8')).toBe('می‌روم');
  });

  it('reads stdin when asked via "-"', async () => {
    const stdout: string[] = [];
    const io = stubIo(stdout, [], 'می روم');
    const code = await run({ ...baseOptions, files: ['-'] }, io);
    expect(code).toBe(0);
    expect(stdout.join('')).toBe('می‌روم');
  });

  it('reads stdin when no file is given and stdin is not a TTY', async () => {
    const stdout: string[] = [];
    const code = await run(baseOptions, stubIo(stdout, [], 'کتاب ها'));
    expect(code).toBe(0);
    expect(stdout.join('')).toBe('کتاب‌ها');
  });

  it('prints usage and exits 2 when stdin is a TTY and no file given', async () => {
    const stderr: string[] = [];
    const io: Io = {
      stdout: () => {},
      stderr: (s) => stderr.push(s),
      stdin: async () => '',
      isTTY: () => true,
    };
    const code = await run(baseOptions, io);
    expect(code).toBe(2);
    expect(stderr.join('')).toContain('no input file');
  });

  it('--check reports issues and exits 1', async () => {
    const file = join(workdir, 'u3.txt');
    writeFileSync(file, 'کتاب ها', 'utf8');
    const stderr: string[] = [];
    const code = await run(
      { ...baseOptions, files: [file], check: true },
      stubIo([], stderr),
    );
    expect(code).toBe(1);
    expect(stderr.join('')).toContain('1 half-space issue found');
  });

  it('--check is silent when the text is clean', async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = await run(
      { ...baseOptions, files: ['-'], check: true },
      stubIo(stdout, stderr, 'کتاب‌ها'),
    );
    expect(code).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout).toEqual([]);
  });

  it('--report lists each issue with position and rule', async () => {
    const file = join(workdir, 'u4.txt');
    writeFileSync(file, 'کتاب ها می روم', 'utf8');
    const stderr: string[] = [];
    const code = await run(
      { ...baseOptions, files: [file], report: true },
      stubIo([], stderr),
    );
    expect(code).toBe(0);
    const report = stderr.join('');
    expect(report).toContain('u4.txt:1:5 [suffix]');
    expect(report).toContain('u4.txt:1:11 [prefix]');
    expect(report).toContain('" " →');
  });

  it('exits 2 when a file cannot be read', async () => {
    const stderr: string[] = [];
    const code = await run(
      { ...baseOptions, files: [join(workdir, 'missing.txt')] },
      stubIo([], stderr),
    );
    expect(code).toBe(2);
    expect(stderr.join('')).toContain('cannot read');
  });

  it('exits 2 when stdin reading fails', async () => {
    const stderr: string[] = [];
    const io: Io = {
      ...stubIo([], stderr),
      stdin: async () => {
        throw new Error('pipe broken');
      },
    };
    const code = await run({ ...baseOptions, files: ['-'] }, io);
    expect(code).toBe(2);
    expect(stderr.join('')).toContain('pipe broken');
  });
});

describe('main (unit)', () => {
  it('prints usage for --help without touching the exit code', async () => {
    const written: string[] = [];
    const original = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string) => {
      written.push(chunk);
      return true;
    }) as typeof process.stdout.write;
    try {
      await main(['--help']);
    } finally {
      process.stdout.write = original;
    }
    expect(written.join('')).toContain('Usage');
    expect(process.exitCode === 0 || process.exitCode === undefined).toBe(true);
  });

  it('prints the version for -v', async () => {
    const written: string[] = [];
    const original = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string) => {
      written.push(chunk);
      return true;
    }) as typeof process.stdout.write;
    try {
      await main(['-v']);
    } finally {
      process.stdout.write = original;
    }
    expect(written.join('').trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('sets exit code 2 for a parse error', async () => {
    const original = process.exitCode;
    try {
      await main(['--bogus']);
      expect(process.exitCode).toBe(2);
    } finally {
      process.exitCode = original;
    }
  });

  it('runs the pipeline for a file argument', async () => {
    const file = join(workdir, 'u5.txt');
    writeFileSync(file, 'می کرد', 'utf8');
    const original = process.exitCode;
    const written: string[] = [];
    const origOut = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string) => {
      written.push(chunk);
      return true;
    }) as typeof process.stdout.write;
    try {
      await main([file]);
      expect(process.exitCode).toBe(0);
    } finally {
      process.stdout.write = origOut;
      process.exitCode = original;
    }
    expect(written.join('')).toBe('می‌کرد');
  });
});
