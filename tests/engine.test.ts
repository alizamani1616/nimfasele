import { describe, expect, it } from 'vitest';
import { ZWNJ } from '../src/constants.js';
import { fixHalfSpace } from '../src/engine.js';
import { COMPOUND_WORDS } from '../src/rules/compounds.js';

describe('fixHalfSpace — prefixes', () => {
  it('joins می to the following verb', () => {
    expect(fixHalfSpace('می کرد')).toBe(`می${ZWNJ}کرد`);
    expect(fixHalfSpace('می رفتیم')).toBe(`می${ZWNJ}رفتیم`);
  });

  it('joins نمی', () => {
    expect(fixHalfSpace('نمی دانم')).toBe(`نمی${ZWNJ}دانم`);
  });

  it('joins بی', () => {
    expect(fixHalfSpace('بی دلیل')).toBe(`بی${ZWNJ}دلیل`);
  });

  it('keeps می before function words (exception)', () => {
    expect(fixHalfSpace('می و مستی')).toBe('می و مستی');
    expect(fixHalfSpace('می فروشی')).toBe('می فروشی');
    expect(fixHalfSpace('می گساری')).toBe('می گساری');
  });

  it('keeps بی before function words', () => {
    expect(fixHalfSpace('بی و اگر')).toBe('بی و اگر');
  });

  it('keeps نمی و phrase intact', () => {
    expect(fixHalfSpace('نمی و نمی')).toBe('نمی و نمی');
  });

  it('never touches a latin word after a prefix', () => {
    expect(fixHalfSpace('می test')).toBe('می test');
  });

  it('does not join across a newline', () => {
    expect(fixHalfSpace('می\nکرد')).toBe('می\nکرد');
  });

  it('joins across multiple spaces', () => {
    expect(fixHalfSpace('می   کرد')).toBe(`می${ZWNJ}کرد`);
  });

  it('leaves already-attached prefixes alone', () => {
    expect(fixHalfSpace('می‌کرد')).toBe(`می‌کرد`);
  });

  it('does not treat می inside a bigger word as a prefix', () => {
    expect(fixHalfSpace('امیدوارم')).toBe('امیدوارم');
  });
});

describe('fixHalfSpace — suffixes', () => {
  it.each([
    ['کتاب ها', `کتاب${ZWNJ}ها`],
    ['کتاب های', `کتاب${ZWNJ}های`],
    ['کتاب هایی', `کتاب${ZWNJ}هایی`],
    ['بزرگ تر', `بزرگ${ZWNJ}تر`],
    ['بزرگ تری', `بزرگ${ZWNJ}تری`],
    ['بزرگ ترین', `بزرگ${ZWNJ}ترین`],
    ['خانه مان', `خانه${ZWNJ}مان`],
    ['خانه تان', `خانه${ZWNJ}تان`],
    ['خانه شان', `خانه${ZWNJ}شان`],
    ['گل هام', `گل${ZWNJ}هام`],
    ['گل هات', `گل${ZWNJ}هات`],
    ['گل هاش', `گل${ZWNJ}هاش`],
  ])('joins %s → %s', (input, expected) => {
    expect(fixHalfSpace(input)).toBe(expected);
  });

  it('does not join a suffix after a latin word', () => {
    expect(fixHalfSpace('test ها')).toBe('test ها');
  });

  it('does not join a suffix after a number', () => {
    expect(fixHalfSpace('۵ ها')).toBe('۵ ها');
  });

  it('does not treat bigger words as suffixes', () => {
    expect(fixHalfSpace('تراش')).toBe('تراش');
    expect(fixHalfSpace('بستان')).toBe('بستان');
  });

  it('single-letter hosts are left alone', () => {
    expect(fixHalfSpace('و ها')).toBe('و ها');
  });
});

describe('fixHalfSpace — enclitics', () => {
  it.each([
    ['خانه ام', `خانه${ZWNJ}ام`],
    ['خانه ات', `خانه${ZWNJ}ات`],
    ['خانه اش', `خانه${ZWNJ}اش`],
    ['بگو ایم', `بگو${ZWNJ}ایم`],
    ['ماشین ات', `ماشین${ZWNJ}ات`],
    ['کلاه اش', `کلاه${ZWNJ}اش`],
    ['خانه ای', `خانه${ZWNJ}ای`],
  ])('joins with ZWNJ after vowels: %s → %s', (input, expected) => {
    expect(fixHalfSpace(input)).toBe(expected);
  });

  it.each([
    ['کتاب ام', 'کتابم'],
    ['کتاب ات', 'کتابت'],
    ['کتاب اش', 'کتابش'],
    ['خورده ایم', `خورده${ZWNJ}ایم`],
    ['رفته اید', `رفته${ZWNJ}اید`],
    ['بود اند', 'بودند'],
    ['رفت اند', 'رفتند'],
    ['خورده اند', `خورده${ZWNJ}اند`],
  ])('attaches directly after consonants: %s → %s', (input, expected) => {
    expect(fixHalfSpace(input)).toBe(expected);
  });

  it('protects the vocative particle ای after consonant-final words', () => {
    expect(fixHalfSpace('سلام ای دوست')).toBe('سلام ای دوست');
  });

  it('does not attach enclitics after function words', () => {
    expect(fixHalfSpace('ما ایم')).toBe('ما ایم');
    expect(fixHalfSpace('شما اید')).toBe('شما اید');
    expect(fixHalfSpace('این اند')).toBe('این اند');
  });

  it('enclitic mid-sentence with a following word', () => {
    expect(fixHalfSpace('کتاب ام را خواندم')).toBe(`کتابم را خواندم`);
  });
});

describe('fixHalfSpace — compounds', () => {
  it('joins classic two-word compounds', () => {
    expect(fixHalfSpace('راه آهن')).toBe(`راه${ZWNJ}آهن`);
    expect(fixHalfSpace('پیش بینی')).toBe(`پیش${ZWNJ}بینی`);
    expect(fixHalfSpace('نرم افزار')).toBe(`نرم${ZWNJ}افزار`);
  });

  it('joins multi-word compounds', () => {
    expect(fixHalfSpace('خانه به خانه')).toBe(`خانه${ZWNJ}به${ZWNJ}خانه`);
    expect(fixHalfSpace('برف پاک کن')).toBe(`برف${ZWNJ}پاک${ZWNJ}کن`);
    expect(fixHalfSpace('رو به رو')).toBe(`رو${ZWNJ}به${ZWNJ}رو`);
  });

  it('prefers the longest compound', () => {
    // «تک به تک» must win over partial «تک تک» logic
    expect(fixHalfSpace('تک به تک')).toBe(`تک${ZWNJ}به${ZWNJ}تک`);
  });

  it('does not join compound parts that are not adjacent', () => {
    expect(fixHalfSpace('راه سریع آهن')).toBe('راه سریع آهن');
  });

  it('joins compounds with a suffix afterwards', () => {
    expect(fixHalfSpace('راه آهن ها')).toBe(`راه${ZWNJ}آهن${ZWNJ}ها`);
  });

  it('can be disabled', () => {
    expect(fixHalfSpace('راه آهن', { compounds: false })).toBe('راه آهن');
  });
});

describe('fixHalfSpace — cleanup', () => {
  it('repairs a ZWNJ glued to a space before a word', () => {
    expect(fixHalfSpace('می ‌کرد')).toBe(`می${ZWNJ}کرد`);
  });

  it('repairs doubled ZWNJ', () => {
    expect(fixHalfSpace('می‌‌کرد')).toBe(`می${ZWNJ}کرد`);
  });

  it('removes ZWNJ at word start after punctuation', () => {
    expect(fixHalfSpace('گفت: ‌سلام')).toBe('گفت: سلام');
  });

  it('removes ZWNJ at word end before punctuation', () => {
    expect(fixHalfSpace('کتاب‌،')).toBe('کتاب،');
  });

  it('removes trailing ZWNJ at text end', () => {
    expect(fixHalfSpace('کتاب‌')).toBe('کتاب');
  });

  it('removes ZWNJ runs around a space', () => {
    expect(fixHalfSpace('می‌ ‌کرد')).toBe(`می${ZWNJ}کرد`);
  });

  it('can be disabled', () => {
    expect(fixHalfSpace('کتاب‌،', { cleanup: false })).toBe('کتاب‌،');
  });
});

describe('fixHalfSpace — normalization', () => {
  it('normalizes Arabic chars by default', () => {
    expect(fixHalfSpace('علي')).toBe('علی');
  });

  it('can skip normalization', () => {
    expect(fixHalfSpace('علي', { normalize: false })).toBe('علي');
  });

  it('fixes half-spaces in normalized Arabic text', () => {
    expect(fixHalfSpace('مي كرد')).toBe(`می${ZWNJ}کرد`);
  });
});

describe('fixHalfSpace — mixed content is untouched', () => {
  it('leaves URLs intact', () => {
    const text = 'به https://fa.wikipedia.org/wiki/فارسی سر بزن';
    expect(fixHalfSpace(text)).toBe(text);
  });

  it('leaves emails intact', () => {
    expect(fixHalfSpace('ایمیل من user@mail.com است')).toBe(
      `ایمیل من user@mail.com است`,
    );
  });

  it('leaves numbers intact', () => {
    expect(fixHalfSpace('قیمت ۱٬۵۰۰ تومان شد')).toBe('قیمت ۱٬۵۰۰ تومان شد');
  });

  it('leaves latin text alone', () => {
    expect(fixHalfSpace('The quick brown fox')).toBe('The quick brown fox');
  });

  it('leaves emoji alone', () => {
    expect(fixHalfSpace('خوبی 🙂؟')).toBe('خوبی 🙂؟');
  });
});

describe('fixHalfSpace — input validation and options', () => {
  it('rejects non-string input', () => {
    expect(() => fixHalfSpace(undefined as unknown as string)).toThrow(TypeError);
    expect(() => fixHalfSpace(123 as unknown as string)).toThrow(TypeError);
  });

  it('returns empty string for empty input', () => {
    expect(fixHalfSpace('')).toBe('');
  });

  it('respects prefixes: false', () => {
    expect(fixHalfSpace('می کرد', { prefixes: false })).toBe('می کرد');
  });

  it('respects suffixes: false', () => {
    expect(fixHalfSpace('کتاب ها', { suffixes: false })).toBe('کتاب ها');
  });

  it('respects cleanup: false (broken ZWNJ stays, no prefix join across it)', () => {
    expect(fixHalfSpace('می ‌کرد', { cleanup: false })).toBe('می ‌کرد');
  });
});

describe('fixHalfSpace — data-driven compound coverage', () => {
  it.each(COMPOUND_WORDS.map(([from, to]) => [from, to] as const))(
    'fixes %s',
    (from, to) => {
      expect(fixHalfSpace(from)).toBe(to);
    },
  );
});
