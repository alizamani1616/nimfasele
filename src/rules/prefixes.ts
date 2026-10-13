/**
 * Verbal prefixes that attach to the following word with a ZWNJ:
 * «می‌کرد»، «نمی‌رود»، «بی‌خبر».
 *
 * The prefix is only joined when the next token is a Persian word and the pair
 * is not listed in `exceptions` (e.g. «می» meaning wine: «می و مستی»).
 */
export type PrefixEntry = {
  prefix: string;
  /** Next words after which the prefix must stay separate. */
  exceptions: readonly string[];
};

/** Ordered longest-first so «نمی» is matched before «می». */
export const PREFIXES: readonly PrefixEntry[] = [
  {
    prefix: 'نمی',
    exceptions: ['و', 'یا', 'را', 'هم'],
  },
  {
    prefix: 'می',
    // «می» as the noun "wine" or standalone contexts.
    exceptions: [
      'و',
      'یا',
      'را',
      'از',
      'با',
      'در',
      'به',
      'که',
      'هم',
      'نیز',
      'ای',
      'یعنی',
      'است',
      'نیست',
      'بود',
      'نبود',
      'باشد',
      'فروش',
      'فروشی',
      'فروشگاه',
      'مست',
      'مستی',
      'گسار',
      'گساری',
      'خواره',
      'بار',
    ],
  },
  {
    prefix: 'بی',
    // Function words after «بی» (never noun-modifier contexts).
    exceptions: ['و', 'یا', 'را', 'از', 'با', 'در', 'به', 'که', 'هم', 'است', 'نیست'],
  },
];

/** All prefix strings, longest first — used for token matching. */
export const PREFIX_WORDS: readonly string[] = PREFIXES.map((p) => p.prefix);

const exceptionMap = new Map<string, ReadonlySet<string>>(
  PREFIXES.map((p) => [p.prefix, new Set(p.exceptions)]),
);

/**
 * Should `prefix` stay separated from `nextWord`?
 * @param prefix one of می/نمی/بی
 * @param nextWord the Persian word following it
 */
export function isPrefixException(prefix: string, nextWord: string): boolean {
  return exceptionMap.get(prefix)?.has(nextWord) ?? false;
}
