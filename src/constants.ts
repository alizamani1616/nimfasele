/** Zero-Width Non-Joiner (U+200C) — «نیم‌فاصله». */
export const ZWNJ = '‌';

/** Matches a ZWNJ anywhere. */
export const ZWNJ_GLOBAL = /‌/gu;

/** Arabic-script letters, including Persian-specific ones (پ چ ژ ک گ ی) and tatweel. */
export const LETTER_CHARS =
  '\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06D5\u0640\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06AA\u06C1';

/** Vowel letters a word may end with — enclitics then join with a ZWNJ (خانه‌ام). */
export const VOWEL_ENDING = /[اوینهآئ]$/;

/** Latin letters used inside latin/URL-ish runs. */
export const LATIN_LETTER = /[A-Za-z]/;

/** Digits of all scripts handled (untouched by rules). */
export const DIGIT_CHARS = /[0-9\u06F0-\u06F9\u0660-\u0669]/;

/** Whitespace that may serve as the join point between words (newlines excluded). */
export const JOINABLE_SPACE = /[ \t\u00A0]+/;

/** Characters kept inside a latin run (URLs, emails, dotted names, …). */
export const LATIN_JOIN_CHARS = /[A-Za-z0-9'._+@:/#?&=%~$,!\\-]/;

/** Any whitespace, including newlines. */
export const WHITESPACE = /\s/;

/** Persian (or shared Arabic-script) letter character class as a RegExp fragment. */
export const LETTER_CLASS = `[${LETTER_CHARS}]`;
