import { fixHalfSpace } from './engine.js';
import { ZWNJ } from './constants.js';
import { normalizePersian } from './normalize.js';
import { findHalfSpaceIssues, hasHalfSpaceIssue } from './report.js';
export type { FixOptions, HalfSpaceIssue, IssueRule } from './types.js';

export { fixHalfSpace, ZWNJ, normalizePersian, findHalfSpaceIssues, hasHalfSpaceIssue };

/** Alias for {@link fixHalfSpace}. */
export const addHalfSpaces = fixHalfSpace;
