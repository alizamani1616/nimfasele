import {
  DIGIT_CHARS,
  LATIN_JOIN_CHARS,
  LATIN_LETTER,
  LETTER_CHARS,
  WHITESPACE,
  ZWNJ,
} from './constants.js';

/** Token categories produced by the tokenizer. */
export type TokenType = 'persian' | 'latin' | 'number' | 'space' | 'newline' | 'punct';

/** A slice of the input text with its category and offsets. */
export type Token = {
  text: string;
  type: TokenType;
  /** Start offset in the tokenized string (inclusive). */
  start: number;
  /** End offset in the tokenized string (exclusive). */
  end: number;
};

const LETTER_RE = new RegExp(`[${LETTER_CHARS}]`, 'u');
const DIGIT_RE = new RegExp(DIGIT_CHARS.source, 'u');
const LATIN_LETTER_RE = LATIN_LETTER;
const LATIN_JOIN_RE = LATIN_JOIN_CHARS;
const NEWLINE_RE = /[\n\r]/u;
const NUMBER_SEPARATOR_RE = /[.,:،٬]/u;

/**
 * Split text into tokens. Persian words keep internal ZWNJs («می‌کرد» is one
 * token); latin runs absorb URL/email punctuation (https://x.com/a?b=1 stays
 * atomic); digit runs keep numeric separators (۱٬۰۰۰، 1.5). Newlines become
 * their own token type so join rules never merge words across lines.
 * A ZWNJ that is not between letters becomes an isolated punct token.
 */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const n = text.length;
  let i = 0;

  while (i < n) {
    const ch = text[i] as string;

    if (WHITESPACE.test(ch)) {
      let j = i + 1;
      if (NEWLINE_RE.test(ch)) {
        while (j < n && NEWLINE_RE.test(text[j] as string)) j++;
        tokens.push({ text: text.slice(i, j), type: 'newline', start: i, end: j });
      } else {
        while (
          j < n &&
          !NEWLINE_RE.test(text[j] as string) &&
          WHITESPACE.test(text[j] as string)
        )
          j++;
        tokens.push({ text: text.slice(i, j), type: 'space', start: i, end: j });
      }
      i = j;
      continue;
    }

    if (LETTER_RE.test(ch)) {
      let j = i;
      while (j < n) {
        const c = text[j] as string;
        if (LETTER_RE.test(c)) {
          j++;
          continue;
        }
        if (c === ZWNJ && j + 1 < n && LETTER_RE.test(text[j + 1] as string)) {
          j += 2;
          continue;
        }
        break;
      }
      tokens.push({ text: text.slice(i, j), type: 'persian', start: i, end: j });
      i = j;
      continue;
    }

    if (DIGIT_RE.test(ch)) {
      let j = i;
      while (j < n) {
        const c = text[j] as string;
        if (DIGIT_RE.test(c)) {
          j++;
          continue;
        }
        if (
          NUMBER_SEPARATOR_RE.test(c) &&
          j + 1 < n &&
          DIGIT_RE.test(text[j + 1] as string)
        ) {
          j += 2;
          continue;
        }
        break;
      }
      tokens.push({ text: text.slice(i, j), type: 'number', start: i, end: j });
      i = j;
      continue;
    }

    if (LATIN_LETTER_RE.test(ch)) {
      let j = i;
      while (j < n && LATIN_JOIN_RE.test(text[j] as string)) j++;
      tokens.push({ text: text.slice(i, j), type: 'latin', start: i, end: j });
      i = j;
      continue;
    }

    // punctuation / symbols / emoji — merged into single pass-through tokens;
    // a stray ZWNJ becomes its own single-character token
    let j = i;
    if (ch === ZWNJ) {
      j = i + 1;
    } else {
      while (j < n) {
        const c = text[j] as string;
        if (
          WHITESPACE.test(c) ||
          LETTER_RE.test(c) ||
          DIGIT_RE.test(c) ||
          LATIN_LETTER_RE.test(c) ||
          c === ZWNJ
        )
          break;
        j++;
      }
    }
    tokens.push({ text: text.slice(i, j), type: 'punct', start: i, end: j });
    i = j;
  }

  return tokens;
}
