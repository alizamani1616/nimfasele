/** The Zero-Width Non-Joiner character (U+200C) — «نیم‌فاصله». */
export type FixOptions = {
  /**
   * Normalize Arabic script characters to their Persian equivalents
   * (ي→ی، ك→ک، presentation forms, …) and collapse runs of spaces.
   * @default true
   */
  normalize?: boolean;
  /** Apply the compound-word dictionary (راه آهن → راه‌آهن). @default true */
  compounds?: boolean;
  /** Attach prefixes می/نمی/بی to the following word. @default true */
  prefixes?: boolean;
  /** Attach suffix ها/تر/ترین/… and enclitics ام/ات/اش/…. @default true */
  suffixes?: boolean;
  /** Repair structurally broken ZWNJs (next to spaces, punctuation, doubled, …). @default true */
  cleanup?: boolean;
};

/** Kind of rule that produced a half-space issue. */
export type IssueRule = 'prefix' | 'suffix' | 'enclitic' | 'compound' | 'cleanup';

/** A half-space problem found in a text, with positions on the original string. */
export type HalfSpaceIssue = {
  /** Start offset (inclusive) in the input string. */
  start: number;
  /** End offset (exclusive) in the input string. */
  end: number;
  /** The original substring that will be replaced. */
  original: string;
  /** The suggested replacement substring. */
  suggestion: string;
  /** Which rule detected the issue. */
  rule: IssueRule;
};
