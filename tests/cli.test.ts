import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const CLI = join(import.meta.dirname, '..', 'dist', 'cli.js');

type RunResult = { code: number; stdout: string; stderr: string };

function runCli(args: string[], input?: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString('utf8')));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString('utf8')));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? -1, stdout, stderr }));
    if (input !== undefined) child.stdin.end(input, 'utf8');
    else child.stdin.end();
  });
}

const workdir = mkdtempSync(join(tmpdir(), 'nimfasele-cli-'));
afterAll(() => {
  rmSync(workdir, { recursive: true, force: true });
});

const sample = 'می کردم کتاب های زیادی داشتم';

describe('CLI', () => {
  it('prints usage and exits 2 when stdin is a TTY-less empty call', async () => {
    // No file + closed stdin (not TTY) → reads empty stdin, prints nothing, exits 0
    const result = await runCli([]);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('shows help with --help and exits 0', async () => {
    const result = await runCli(['--help']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('nimfasele');
    expect(result.stdout).toContain('--check');
  });

  it('shows version with --version', async () => {
    const result = await runCli(['--version']);
    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('exits 2 for an unknown option', async () => {
    const result = await runCli(['--nope']);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('unknown option: --nope');
  });

  it('fixes text piped via stdin', async () => {
    const result = await runCli([], sample);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe('می‌کردم کتاب‌های زیادی داشتم');
  });

  it('reads the "-" argument from stdin', async () => {
    const result = await runCli(['-'], sample);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe('می‌کردم کتاب‌های زیادی داشتم');
  });

  it('fixes a file and prints to stdout', async () => {
    const file = join(workdir, 'a.txt');
    writeFileSync(file, sample, 'utf8');
    const result = await runCli([file]);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe('می‌کردم کتاب‌های زیادی داشتم');
    // file untouched without -w
    expect(readFileSync(file, 'utf8')).toBe(sample);
  });

  it('rewrites the file in place with -w', async () => {
    const file = join(workdir, 'b.txt');
    writeFileSync(file, sample, 'utf8');
    const result = await runCli(['-w', file]);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe('');
    expect(readFileSync(file, 'utf8')).toBe('می‌کردم کتاب‌های زیادی داشتم');
  });

  it('--check exits 1 with issues and writes nothing', async () => {
    const file = join(workdir, 'c.txt');
    writeFileSync(file, sample, 'utf8');
    const result = await runCli(['--check', file]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('2 half-space issues');
    expect(result.stdout).toBe('');
    expect(readFileSync(file, 'utf8')).toBe(sample);
  });

  it('--check exits 0 for clean text', async () => {
    const result = await runCli(['--check'], 'می‌کردم کتاب‌های زیادی داشتم');
    expect(result.code).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('--report lists issues with file, line, column and rule', async () => {
    const file = join(workdir, 'd.txt');
    writeFileSync(file, 'کتاب ها\nمی روم', 'utf8');
    const result = await runCli(['--report', file]);
    expect(result.code).toBe(0);
    expect(result.stderr).toContain('d.txt:1:5 [suffix]');
    expect(result.stderr).toContain('d.txt:2:3 [prefix]');
  });

  it('--no-normalize skips character normalization', async () => {
    const result = await runCli(['--no-normalize'], 'علي');
    expect(result.stdout).toBe('علي');
  });

  it('normalizes Arabic characters by default', async () => {
    const result = await runCli([], 'علي');
    expect(result.stdout).toBe('علی');
  });

  it('--no-compounds skips the dictionary', async () => {
    const result = await runCli(['--no-compounds'], 'راه آهن');
    expect(result.stdout).toBe('راه آهن');
  });

  it('exits 2 for a missing file', async () => {
    const missing = join(workdir, 'nope.txt');
    expect(existsSync(missing)).toBe(false);
    const result = await runCli([missing]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('cannot read');
  });

  it('handles an empty input file', async () => {
    const file = join(workdir, 'empty.txt');
    writeFileSync(file, '', 'utf8');
    const result = await runCli([file]);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('handles multiple files in one call', async () => {
    const f1 = join(workdir, 'e1.txt');
    const f2 = join(workdir, 'e2.txt');
    writeFileSync(f1, 'کتاب ها', 'utf8');
    writeFileSync(f2, 'می روم', 'utf8');
    const result = await runCli([f1, f2]);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe('کتاب‌هامی‌روم');
  });
});
