import { describe, expect, it } from 'vitest';
import { COMPOUND_WORDS } from '../src/rules/compounds.js';
import { PREFIXES } from '../src/rules/prefixes.js';
import { ENCLITICS, ZWNJ_SUFFIXES } from '../src/rules/suffixes.js';
import { LETTER_CHARS } from '../src/constants.js';
import { ZWNJ } from '../src/constants.js';

const LETTER_RE = new RegExp(`^[${LETTER_CHARS}]+(‌[${LETTER_CHARS}]+)*$`, 'u');

describe('compound dictionary data', () => {
  it('has at least 250 entries', () => {
    expect(COMPOUND_WORDS.length).toBeGreaterThanOrEqual(250);
  });

  it('has no duplicate keys', () => {
    const keys = COMPOUND_WORDS.map(([from]) => from);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every entry maps a spaced form to a joined form and changes it', () => {
    for (const [from, to] of COMPOUND_WORDS) {
      expect(from, `key ${from}`).not.toBe(to);
      expect(from).toMatch(/ /u);
      expect(to, `target of ${from}`).not.toMatch(/ /u);
    }
  });

  it('keys are 2–4 pure Persian words; targets are letters and ZWNJs only', () => {
    for (const [from, to] of COMPOUND_WORDS) {
      const parts = from.split(' ');
      expect(parts.length, `key ${from}`).toBeGreaterThanOrEqual(2);
      expect(parts.length, `key ${from}`).toBeLessThanOrEqual(4);
      for (const part of parts) {
        expect(part, `part ${part} of ${from}`).toMatch(LETTER_RE);
      }
      expect(to, `target of ${from}`).toMatch(new RegExp(`^[${LETTER_CHARS}‌]+$`, 'u'));
    }
  });
});

describe('prefix data', () => {
  it('contains می، نمی، بی longest-first', () => {
    expect(PREFIXES.map((p) => p.prefix)).toEqual(['نمی', 'می', 'بی']);
  });

  it('exceptions are pure Persian words', () => {
    for (const entry of PREFIXES) {
      expect(entry.exceptions.length).toBeGreaterThan(0);
      for (const word of entry.exceptions) {
        expect(word).toMatch(LETTER_RE);
      }
    }
  });
});

describe('suffix data', () => {
  it('has the expected ZWNJ suffixes', () => {
    expect(new Set(ZWNJ_SUFFIXES)).toEqual(
      new Set([
        'ترین',
        'هایی',
        'تری',
        'های',
        'هام',
        'هات',
        'هاش',
        'مان',
        'تان',
        'شان',
        'تر',
        'ها',
      ]),
    );
  });

  it('has the enclitics ام ات اش ایم اید اند ای', () => {
    expect(new Set(ENCLITICS)).toEqual(
      new Set(['ام', 'ات', 'اش', 'ایم', 'اید', 'اند', 'ای']),
    );
  });
});

describe('constants', () => {
  it('ZWNJ is U+200C', () => {
    expect(ZWNJ.codePointAt(0)).toBe(0x200c);
  });
});
