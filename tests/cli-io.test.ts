import { PassThrough } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import { defaultIo, readStdinFrom } from '../cli/index.js';
import { isPrefixException } from '../src/rules/prefixes.js';
import { endsWithVowel, isForbiddenEncliticHost } from '../src/rules/suffixes.js';

describe('readStdinFrom', () => {
  it('collects chunks until end', async () => {
    const stream = new PassThrough();
    const promise = readStdinFrom(stream);
    stream.write('سلام ');
    stream.write('دنیا');
    stream.end();
    await expect(promise).resolves.toBe('سلام دنیا');
  });

  it('resolves with an empty string for an immediately-ended stream', async () => {
    const stream = new PassThrough();
    stream.end();
    await expect(readStdinFrom(stream)).resolves.toBe('');
  });

  it('rejects on stream errors', async () => {
    const stream = new PassThrough();
    const promise = readStdinFrom(stream);
    stream.emit('error', new Error('boom'));
    await expect(promise).rejects.toThrow('boom');
  });
});

describe('defaultIo', () => {
  it('stdout writes to process.stdout', () => {
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    defaultIo.stdout('x');
    expect(spy).toHaveBeenCalledWith('x');
    spy.mockRestore();
  });

  it('stderr writes to process.stderr', () => {
    const spy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    defaultIo.stderr('y');
    expect(spy).toHaveBeenCalledWith('y');
    spy.mockRestore();
  });

  it('stdin reads process.stdin', async () => {
    const promise = defaultIo.stdin();
    process.stdin.push('زWNJ');
    process.stdin.push(null);
    await expect(promise).resolves.toBe('زWNJ');
  });

  it('isTTY reports a boolean', () => {
    expect(typeof defaultIo.isTTY()).toBe('boolean');
  });
});

describe('rule helper edge branches', () => {
  it('isPrefixException is false for unknown prefixes', () => {
    expect(isPrefixException('نمی', 'و')).toBe(true);
    expect(isPrefixException('می', 'کرد')).toBe(false);
    expect(isPrefixException('xyz' as string, 'و')).toBe(false);
  });

  it('endsWithVowel and isForbiddenEncliticHost cover both sides', () => {
    expect(endsWithVowel('خانه')).toBe(true);
    expect(endsWithVowel('کتاب')).toBe(false);
    expect(isForbiddenEncliticHost('ما')).toBe(true);
    expect(isForbiddenEncliticHost('کتاب')).toBe(false);
  });
});
