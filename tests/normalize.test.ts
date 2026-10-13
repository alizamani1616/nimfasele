import { describe, expect, it } from 'vitest';
import { normalizePersian } from '../src/normalize.js';

describe('normalizePersian — character mapping', () => {
  it('converts Arabic yeh to Farsi yeh', () => {
    expect(normalizePersian('علي')).toBe('علی');
  });

  it('converts Arabic kaf to Keheh', () => {
    expect(normalizePersian('بك')).toBe('بک');
  });

  it('converts alif maqsura', () => {
    expect(normalizePersian('مستشفى')).toBe('مستشفی');
  });

  it('converts waw with hamza (موثر، رؤیا)', () => {
    expect(normalizePersian('موثر')).toBe('موثر'); // already normal
    expect(normalizePersian('مؤثر')).toBe('موثر');
    expect(normalizePersian('رؤیا')).toBe('رویا');
  });

  it('converts teh marbuta', () => {
    expect(normalizePersian('مدرسة')).toBe('مدرسه');
  });

  it('converts hamza-carrier alefs', () => {
    expect(normalizePersian('أب إبراهیم ٱلله')).toBe('اب ابراهیم الله');
  });

  it('keeps ئ intact (مسئول)', () => {
    expect(normalizePersian('مسئول')).toBe('مسئول');
  });

  it('keeps آ intact', () => {
    expect(normalizePersian('آب')).toBe('آب');
  });

  it('decomposes Arabic presentation forms', () => {
    // U+FBFC (Farsi yeh isolated form) → ی; U+FB58 (peh medial form) → پ
    expect(normalizePersian('\uFBFC\uFB58')).toBe('یپ');
    // U+FEFB (lam-alef ligature) → لا
    expect(normalizePersian('\uFEFB')).toBe('لا');
  });

  it('removes zero-width space', () => {
    expect(normalizePersian('سلام\u200Bدنیا')).toBe('سلامدنیا');
  });

  it('keeps ZWJ for emoji sequences', () => {
    const family = '👨‍👩‍👧‍👦';
    expect(normalizePersian(family)).toBe(family);
  });
});

describe('normalizePersian — whitespace', () => {
  it('collapses runs of spaces', () => {
    expect(normalizePersian('سلام    دنیا')).toBe('سلام دنیا');
  });

  it('collapses tabs and NBSP to one space', () => {
    expect(normalizePersian('a\tb\u00A0c')).toBe('a b c');
  });

  it('preserves newlines', () => {
    expect(normalizePersian('سلام\n\nدنیا')).toBe('سلام\n\nدنیا');
    expect(normalizePersian('سلام\r\nدنیا')).toBe('سلام\r\nدنیا');
  });

  it('does not collapse the newline out of CRLF', () => {
    expect(normalizePersian('a \r\n b')).toBe('a \r\n b');
  });
});

describe('normalizePersian — general', () => {
  it('is idempotent', () => {
    for (const text of ['علي', 'a\tb', 'سلام  ‌  دنیا', '\uFEEB', '']) {
      expect(normalizePersian(normalizePersian(text))).toBe(normalizePersian(text));
    }
  });

  it('leaves persian text unchanged', () => {
    expect(normalizePersian('می‌خورد')).toBe('می‌خورد');
  });

  it('leaves digits untouched', () => {
    expect(normalizePersian('۱۴۰۳ 2026')).toBe('۱۴۰۳ 2026');
  });

  it('handles the empty string', () => {
    expect(normalizePersian('')).toBe('');
  });

  it('rejects non-string input', () => {
    expect(() => normalizePersian(42 as unknown as string)).toThrow(TypeError);
  });
});
