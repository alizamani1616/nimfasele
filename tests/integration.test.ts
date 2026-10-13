import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fixHalfSpace } from '../src/engine.js';
import { findHalfSpaceIssues } from '../src/report.js';

const FIXTURES = join(import.meta.dirname, 'fixtures');

const read = (name: string): string => readFileSync(join(FIXTURES, name), 'utf8');

describe('integration — real-world fixtures', () => {
  const files = ['news.txt', 'mixed.txt', 'emoji.txt', 'broken.txt'];

  it.each(files)('%s: tokens reassemble, output is idempotent', (name) => {
    const text = read(name);
    const fixed = fixHalfSpace(text);
    expect(fixHalfSpace(fixed)).toBe(fixed);
    // structure preserved: same number of lines
    expect(fixed.split('\n').length).toBe(text.split('\n').length);
  });

  it.each(files)('%s: issues slice onto the input', (name) => {
    const text = read(name);
    for (const issue of findHalfSpaceIssues(text)) {
      expect(text.slice(issue.start, issue.end)).toBe(issue.original);
    }
  });

  it('news fixture actually improves', () => {
    const fixed = fixHalfSpace(read('news.txt'));
    expect(fixed).toContain('پیش‌بینی');
    expect(fixed).toContain('راه‌آهن');
    expect(fixed).toContain('نرم‌افزار');
    expect(fixed).toContain('می‌شود');
    expect(fixed).toContain('بین‌المللی');
    expect(fixed).toContain('موزه‌ها');
    expect(fixed).toContain('ماه‌های');
    expect(fixed).toContain('هفته');
  });

  it('mixed fixture keeps latin, URLs, emails and numbers intact', () => {
    const fixed = fixHalfSpace(read('mixed.txt'));
    expect(fixed).toContain('npm install nimfasele');
    expect(fixed).toContain('https://example.com/docs');
    expect(fixed).toContain('user@example.com');
    expect(fixed).toContain('v2.0');
    expect(fixed).toContain('۱٬۵۰۰');
    expect(fixed).toContain('12');
    expect(fixed).toContain('می‌کرد');
    expect(fixed).toContain('برمی‌گرداند');
  });

  it('emoji fixture keeps ZWJ sequences and emoji untouched', () => {
    const fixed = fixHalfSpace(read('emoji.txt'));
    expect(fixed).toContain('👨‍👩‍👧‍👦');
    expect(fixed).toContain('⭐️⭐️⭐️⭐️⭐️');
    expect(fixed).toContain('کتاب‌ها');
    expect(fixed).toContain('مجله‌ها');
    expect(fixed).toContain('پنج‌ستاره');
  });

  it('broken fixture repairs structurally broken ZWNJs', () => {
    const fixed = fixHalfSpace(read('broken.txt'));
    expect(fixed).not.toMatch(/ ‌/u);
    expect(fixed).not.toMatch(/‌ /u);
    expect(fixed).toContain('سلام');
    expect(fixed).toContain('نیم‌فاصله');
    expect(fixed).toContain('نیم‌فاصله‌ها');
    expect(fixed).toContain('علی');
    expect(fixed).toContain('می‌خواهم');
    expect(fixed).toContain('سخت‌افزار');
    expect(fixed).toContain('نرم‌افزار');
  });

  it('long text performs sanely (100KB under a second)', () => {
    const paragraph = read('news.txt');
    const big = paragraph.repeat(220); // ~100 KB
    const started = performance.now();
    const fixed = fixHalfSpace(big);
    const elapsed = performance.now() - started;
    expect(fixed.length).toBeGreaterThan(50_000);
    expect(elapsed).toBeLessThan(1000);
  });
});

describe('integration — snapshot', () => {
  it('news.txt output snapshot', () => {
    expect(fixHalfSpace(read('news.txt'))).toMatchSnapshot();
  });

  it('mixed.txt output snapshot', () => {
    expect(fixHalfSpace(read('mixed.txt'))).toMatchSnapshot();
  });

  it('emoji.txt output snapshot', () => {
    expect(fixHalfSpace(read('emoji.txt'))).toMatchSnapshot();
  });

  it('broken.txt output snapshot', () => {
    expect(fixHalfSpace(read('broken.txt'))).toMatchSnapshot();
  });
});
