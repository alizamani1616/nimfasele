import { VOWEL_ENDING } from '../constants.js';

/**
 * Suffixes that always join the previous word with a ZWNJ:
 * «کتاب‌ها»، «بزرگ‌ترین»، «خانه‌مان».
 * Listed longest-first for matching («ترین» before «تر»).
 */
export const ZWNJ_SUFFIXES: readonly string[] = [
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
];

/**
 * Enclitic pronouns (ضمایر پیوسته). Join mode depends on the final letter of
 * the host word: after a vowel → ZWNJ (خانه‌ام)، after a consonant → direct
 * attachment (کتابم). «ای» only joins vowel-final hosts (خانه‌ای) and is left
 * untouched otherwise to protect the vocative particle («سلام ای دوست»).
 */
export const ENCLITICS: readonly string[] = [
  'ایم',
  'اید',
  'اند',
  'ام',
  'ات',
  'اش',
  'ای',
];

/**
 * Words after which an enclitic must never attach (function words and
 * pronouns standing alone: «ما ایم» is not «مایم»).
 */
export const ENCLITIC_HOST_EXCEPTIONS: readonly string[] = [
  'من',
  'تو',
  'او',
  'ما',
  'شما',
  'آن',
  'این',
  'هر',
  'هیچ',
  'چند',
  'یک',
  'چه',
  'که',
  'را',
  'و',
  'یا',
  'اما',
  'ولی',
  'اگر',
  'پس',
  'تا',
  'چون',
];

/** Longest-first list of enclitics for token matching. */
export const ENCLITIC_WORDS: readonly string[] = [...ENCLITICS].sort(
  (a, b) => b.length - a.length,
);

/** Longest-first list of ZWNJ suffixes for token matching. */
export const ZWNJ_SUFFIX_WORDS: readonly string[] = [...ZWNJ_SUFFIXES].sort(
  (a, b) => b.length - a.length,
);

/** Does `word` end with a vowel letter (ا آ و ی ه ئ)? */
export function endsWithVowel(word: string): boolean {
  return VOWEL_ENDING.test(word);
}

/** Is `word` a forbidden enclitic host (function word/pronoun)? */
export function isForbiddenEncliticHost(word: string): boolean {
  return ENCLITIC_HOST_EXCEPTIONS.includes(word);
}
