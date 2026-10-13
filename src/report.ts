import { collectEdits, resolveOptions } from './engine.js';
import type { FixOptions, HalfSpaceIssue } from './types.js';

/**
 * Find half-space issues in `text` without modifying it. Offsets map exactly
 * onto the input string as given (no normalization is applied here, so that
 * `original` always equals `text.slice(start, end)`). Issues are ordered by
 * position.
 *
 * If the text contains non-standard characters (e.g. Arabic ي), pre-normalize
 * with {@link normalizePersian} for complete coverage — but then the offsets
 * refer to the normalized copy.
 */
export function findHalfSpaceIssues(
  text: string,
  options?: FixOptions,
): HalfSpaceIssue[] {
  if (typeof text !== 'string') {
    throw new TypeError('findHalfSpaceIssues expects a string');
  }
  const resolved = resolveOptions({ ...options, normalize: false });
  return collectEdits(text, resolved)
    .map((edit) => ({
      start: edit.start,
      end: edit.end,
      original: text.slice(edit.start, edit.end),
      suggestion: edit.replacement,
      rule: edit.rule,
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

/** Does `text` contain any half-space issue? */
export function hasHalfSpaceIssue(text: string, options?: FixOptions): boolean {
  return findHalfSpaceIssues(text, options).length > 0;
}
