import { describe, expect, it } from 'vitest';
import { tokenize } from '../src/tokenizer.js';
import type { Token } from '../src/tokenizer.js';

const texts = (text: string): string[] => tokenize(text).map((t) => t.text);
const types = (text: string): string[] => tokenize(text).map((t) => t.type);
const offsets = (text: string): Array<[number, number]> =>
  tokenize(text).map((t) => [t.start, t.end] as [number, number]);

describe('tokenize — persian words', () => {
  it('splits simple words', () => {
    expect(texts('سلام دنیا')).toEqual(['سلام', ' ', 'دنیا']);
    expect(types('سلام دنیا')).toEqual(['persian', 'space', 'persian']);
  });

  it('keeps ZWNJ inside a word', () => {
    expect(texts('می‌کردم')).toEqual(['می‌کردم']);
    expect(types('می‌کردم')).toEqual(['persian']);
  });

  it('isolates a stray ZWNJ as punct', () => {
    const toks = tokenize('سلام ‌ دنیا');
    expect(toks.map((t) => t.type)).toEqual([
      'persian',
      'space',
      'punct',
      'space',
      'persian',
    ]);
  });

  it('ZWNJ at word edge does not join the token', () => {
    expect(texts('کتاب‌')).toEqual(['کتاب', '‌']);
    expect(types('کتاب‌')).toEqual(['persian', 'punct']);
  });
});

describe('tokenize — latin and numbers stay atomic', () => {
  it('URL with query string is one latin token', () => {
    expect(texts('https://example.com/a?b=1&c=2')).toEqual([
      'https://example.com/a?b=1&c=2',
    ]);
  });

  it('email is one latin token', () => {
    expect(texts('user.name+tag@mail.example.com')).toEqual([
      'user.name+tag@mail.example.com',
    ]);
  });

  it('windows path stays intact', () => {
    expect(texts('C:\\Users\\ali\\file.txt')).toEqual(['C:\\Users\\ali\\file.txt']);
  });

  it('latin word with apostrophe', () => {
    expect(texts("don't")).toEqual(["don't"]);
  });

  it('latin word followed by persian word', () => {
    expect(texts('Hello سلام')).toEqual(['Hello', ' ', 'سلام']);
  });

  it('mixed digits and letters', () => {
    expect(types('v1.2.3')).toEqual(['latin']);
  });

  it('persian digits are numbers with separators', () => {
    expect(texts('۱٬۰۰۰')).toEqual(['۱٬۰۰۰']);
    expect(types('1.5')).toEqual(['number']);
    expect(types('12:30')).toEqual(['number']);
    expect(types('1,000')).toEqual(['number']);
  });

  it('trailing separator does not glue to a number', () => {
    expect(types('۵،')).toEqual(['number', 'punct']);
  });
});

describe('tokenize — whitespace and punctuation', () => {
  it('newline is its own token type', () => {
    expect(types('سلام\nدنیا')).toEqual(['persian', 'newline', 'persian']);
  });

  it('multiple spaces merge into one token', () => {
    expect(texts('a    b')).toEqual(['a', '    ', 'b']);
    expect(types('a    b')).toEqual(['latin', 'space', 'latin']);
  });

  it('consecutive punctuation merges', () => {
    expect(texts('سلام!!!')).toEqual(['سلام', '!!!']);
  });

  it('emoji pass through as punct tokens', () => {
    expect(types('🙂 سلام')).toEqual(['punct', 'space', 'persian']);
  });

  it('emoji ZWJ sequences pass through unchanged', () => {
    const family = '👨‍👩‍👧‍👦';
    expect(texts(`خانواده ${family}`)).toEqual(['خانواده', ' ', family]);
  });

  it('parentheses around persian text', () => {
    expect(types('(سلام)')).toEqual(['punct', 'persian', 'punct']);
  });
});

describe('tokenize — offsets', () => {
  it('offsets map exactly onto the input', () => {
    const text = 'سلام دنیا! می‌بینم https://x.com?a=1';
    for (const [start, end] of offsets(text) as Array<[number, number]>) {
      expect(text.slice(start, end)).toBe(
        tokenize(text).find((t) => t.start === start)!.text,
      );
    }
  });

  it('tokens concatenate back to the original text', () => {
    for (const text of ['', ' ', 'سلام دنیا', 'a\nb\r\nc', 'می ‌کرد', '«گفت: بیا!»']) {
      const joined = tokenize(text)
        .map((t) => t.text)
        .join('');
      expect(joined).toBe(text);
    }
  });

  it('tokenizes the empty string to no tokens', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('tokenize — mixed real-world text', () => {
  it('handles a mixed sentence', () => {
    const text = 'در سال ۱۴۰۳، نسخه v2.0 از کتابخانه منتشر شد (بخش دوم).';
    const toks: Token[] = tokenize(text);
    expect(toks.map((t) => t.text).join('')).toBe(text);
    expect(toks.find((t) => t.text === 'v2.0')?.type).toBe('latin');
    expect(toks.find((t) => t.text === '۱۴۰۳')?.type).toBe('number');
    expect(toks.find((t) => t.text === '،')?.type).toBe('punct');
  });
});
