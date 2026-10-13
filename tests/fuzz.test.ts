import { describe, expect, it } from 'vitest';
import { ZWNJ } from '../src/constants.js';
import { fixHalfSpace } from '../src/engine.js';
import { normalizePersian } from '../src/normalize.js';
import { findHalfSpaceIssues } from '../src/report.js';
import { COMPOUND_WORDS } from '../src/rules/compounds.js';

/** Deterministic PRNG (mulberry32) so failures are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALPHABET = [
  'می',
  'نمی',
  'بی',
  'کتاب',
  'خانه',
  'بزرگ',
  'ها',
  'های',
  'ترین',
  'ام',
  'اند',
  'ای',
  'راه',
  'آهن',
  'به',
  'و',
  'رفت',
  'خورده',
  'B',
  'https://x.com?a=1',
  'user@mail.com',
  '۱۲۳',
  '۵',
  '🙂',
  ZWNJ,
  ' ',
  '  ',
  '\n',
  '،',
  '.',
  ':',
  '‌',
  '(',
  ')',
];

function randomText(rng: () => number, maxPieces = 40): string {
  const pieces = Math.floor(rng() * maxPieces) + 1;
  let out = '';
  for (let i = 0; i < pieces; i++) {
    out += ALPHABET[Math.floor(rng() * ALPHABET.length)]!;
  }
  return out;
}

describe('fuzz — fixHalfSpace never crashes and is idempotent', () => {
  it('2000 seeded random inputs: no crash, idempotent, output stays a string', () => {
    const rng = mulberry32(1403);
    for (let i = 0; i < 2000; i++) {
      const text = randomText(rng);
      let first: string;
      expect(() => {
        first = fixHalfSpace(text);
      }).not.toThrow();
      first = fixHalfSpace(text);
      const second = fixHalfSpace(first);
      expect(second, `not idempotent for ${JSON.stringify(text)}`).toBe(first);
    }
  });

  it('fuzz with all options disabled keeps text identical (except nothing)', () => {
    const rng = mulberry32(7);
    const off = {
      normalize: false,
      compounds: false,
      prefixes: false,
      suffixes: false,
      cleanup: false,
    };
    for (let i = 0; i < 300; i++) {
      const text = randomText(rng);
      expect(fixHalfSpace(text, off)).toBe(text);
    }
  });

  it('fuzz normalizePersian is idempotent', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 500; i++) {
      const text = randomText(rng);
      const once = normalizePersian(text);
      expect(normalizePersian(once)).toBe(once);
    }
  });

  it('joined outputs never contain a ZWNJ next to a space or punctuation', () => {
    const rng = mulberry32(1234);
    for (let i = 0; i < 1000; i++) {
      const out = fixHalfSpace(randomText(rng));
      expect(out).not.toMatch(new RegExp(`${ZWNJ}[ \\n،.:()]`));
      expect(out).not.toMatch(new RegExp(`[ \\n،.:()]${ZWNJ}`));
    }
  });
});

describe('fuzz — report stays consistent with the string', () => {
  it('every issue slices exactly onto its input', () => {
    const rng = mulberry32(555);
    for (let i = 0; i < 500; i++) {
      const text = randomText(rng);
      for (const issue of findHalfSpaceIssues(text)) {
        expect(text.slice(issue.start, issue.end)).toBe(issue.original);
        expect(issue.start).toBeLessThan(issue.end);
        expect(issue.end).toBeLessThanOrEqual(text.length);
      }
    }
  });
});

describe('fuzz — compound outputs stay stable', () => {
  it('fixing a compound twice changes nothing', () => {
    for (const [, to] of COMPOUND_WORDS) {
      expect(fixHalfSpace(to, { normalize: false })).toBe(to);
    }
  });
});
