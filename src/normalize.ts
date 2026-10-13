/**
 * Single-character normalizations: Arabic variants → Persian equivalents.
 * ئ and ZWJ are intentionally preserved (essential in مسئول and emoji sequences).
 */
const CHAR_MAP: Readonly<Record<string, string>> = {
  ي: 'ی', // Arabic yeh → Farsi yeh
  ى: 'ی', // alif maqsura → Farsi yeh
  ك: 'ک', // Arabic kaf → Keheh
  ؤ: 'و', // waw with hamza → waw (موثر، رؤیا → موثر، رویا)
  ة: 'ه', // teh marbuta → heh
  أ: 'ا',
  إ: 'ا',
  ٱ: 'ا',
  '\u200B': '', // zero-width space → removed
};

const PRESENTATION_START = 0xfb50;
const PRESENTATION_END = 0xfeff;

/**
 * Normalize a Persian text:
 * - Arabic yeh/kaf and other variants → Persian forms
 * - Arabic presentation forms → standard forms (NFKC per character)
 * - Runs of horizontal spaces (incl. NBSP) collapse to one space; newlines preserved
 * - Zero-width spaces removed; ZWJ kept for emoji sequences
 *
 * The function is idempotent.
 */
export function normalizePersian(text: string): string {
  if (typeof text !== 'string') {
    throw new TypeError('normalizePersian expects a string');
  }
  let out = '';
  for (const ch of text) {
    const mapped = CHAR_MAP[ch];
    if (mapped !== undefined) {
      out += mapped;
      continue;
    }
    const code = ch.codePointAt(0) ?? 0;
    if (code >= PRESENTATION_START && code <= PRESENTATION_END) {
      out += ch.normalize('NFKC');
      continue;
    }
    out += ch;
  }
  return out.replace(/[^\S\n\r]+/gu, ' ');
}
