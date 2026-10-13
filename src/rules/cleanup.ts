import { LETTER_CHARS } from '../constants.js';

/**
 * Structural repairs for broken ZWNJs, applied in order:
 * 1. ZWNJ runs wrapped in horizontal space («به ‌ B»، «می‌ ‌کرد») → one space.
 * 2. ZWNJ runs after a non-letter or at text start («، ‌سلام») → remove.
 * 3. ZWNJ runs before a non-letter or at text end («کتاب‌،»، «کتاب‌») → remove.
 *
 * After a full pass every ZWNJ has Persian letters on both sides and no
 * doubled spaces are left behind; the pass is idempotent.
 */
export const CLEANUP_PATTERNS: readonly {
  regex: RegExp;
  replacement: string;
}[] = [
  {
    regex: new RegExp(`[ \\t\\u00A0]*(?:\u200C)+[ \\t\\u00A0]+`, 'gu'),
    replacement: ' ',
  },
  {
    regex: new RegExp(`(^|[^${LETTER_CHARS}\u200C])(?:\u200C)+`, 'gu'),
    replacement: '$1',
  },
  {
    regex: new RegExp(`(?:\u200C)+(?=[^${LETTER_CHARS}]|$)`, 'gu'),
    replacement: '',
  },
];
