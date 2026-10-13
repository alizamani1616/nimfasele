import { ZWNJ } from './constants.js';
import { normalizePersian } from './normalize.js';
import { CLEANUP_PATTERNS } from './rules/cleanup.js';
import { COMPOUND_LOOKUP } from './rules/compounds.js';
import { isPrefixException, PREFIX_WORDS } from './rules/prefixes.js';
import {
  ENCLITIC_WORDS,
  endsWithVowel,
  isForbiddenEncliticHost,
  ZWNJ_SUFFIX_WORDS,
} from './rules/suffixes.js';
import type { Token } from './tokenizer.js';
import { tokenize } from './tokenizer.js';
import type { FixOptions, IssueRule } from './types.js';

/** All options resolved to concrete values. */
export type ResolvedOptions = Required<FixOptions>;

/** A pending change on a string, produced by a detection pass. */
export type DraftEdit = {
  start: number;
  end: number;
  replacement: string;
  rule: IssueRule;
};

const DEFAULTS: ResolvedOptions = {
  normalize: true,
  compounds: true,
  prefixes: true,
  suffixes: true,
  cleanup: true,
};

/** @internal */
export function resolveOptions(options?: FixOptions): ResolvedOptions {
  return { ...DEFAULTS, ...options };
}

const MAX_PASSES = 4;
const MAX_COMPOUND_PARTS = 4;

/**
 * Detect every half-space edit applicable to `text`. Edits never overlap;
 * when two rules target the same span the first detected one wins.
 */
export function collectEdits(text: string, options: ResolvedOptions): DraftEdit[] {
  const edits: DraftEdit[] = [];
  const seen = new Set<string>();
  const add = (edit: DraftEdit): void => {
    const key = `${edit.start}:${edit.end}`;
    if (seen.has(key)) return;
    seen.add(key);
    edits.push(edit);
  };

  if (options.cleanup) collectCleanupEdits(text, add);

  const tokens = tokenize(text);
  const words: Token[] = [];
  const wordTokenIndices: number[] = [];
  tokens.forEach((token, index) => {
    if (token.type === 'persian') {
      words.push(token);
      wordTokenIndices.push(index);
    }
  });

  if (options.compounds) collectCompoundEdits(words, add);
  if (options.prefixes) collectPrefixEdits(tokens, words, wordTokenIndices, add);
  if (options.suffixes) collectSuffixEdits(tokens, words, wordTokenIndices, add);

  return edits;
}

function collectCleanupEdits(text: string, add: (edit: DraftEdit) => void): void {
  for (const pattern of CLEANUP_PATTERNS) {
    for (const match of text.matchAll(pattern.regex)) {
      const full = match[0];
      if (full === undefined || full.length === 0) continue;
      const start = match.index ?? 0;
      // Each pattern keeps at most one capture group (the separator or the
      // character before the ZWNJ run); the ZWNJ run itself is dropped.
      const firstGroup = match[1];
      const replacement = firstGroup === undefined ? '' : firstGroup;
      add({ start, end: start + full.length, replacement, rule: 'cleanup' });
    }
  }
}

function collectCompoundEdits(
  words: readonly Token[],
  add: (edit: DraftEdit) => void,
): void {
  let i = 0;
  while (i < words.length) {
    let matched = false;
    const maxParts = Math.min(MAX_COMPOUND_PARTS, words.length - i);
    for (let parts = maxParts; parts >= 2; parts--) {
      const slice = words.slice(i, i + parts);
      const key = slice.map((token) => token.text).join(' ');
      const target = COMPOUND_LOOKUP.get(key);
      if (target === undefined) continue;
      const first = slice[0]!;
      const last = slice[parts - 1]!;
      add({ start: first.start, end: last.end, replacement: target, rule: 'compound' });
      i += parts;
      matched = true;
      break;
    }
    if (!matched) i++;
  }
}

function isJoinableSeparator(token: Token | undefined): token is Token {
  return token !== undefined && token.type === 'space';
}

function collectPrefixEdits(
  tokens: readonly Token[],
  words: readonly Token[],
  wordTokenIndices: readonly number[],
  add: (edit: DraftEdit) => void,
): void {
  for (let wi = 0; wi < words.length; wi++) {
    const prefix = words[wi]!;
    if (!PREFIX_WORDS.includes(prefix.text)) continue;
    const tokenIndex = wordTokenIndices[wi] ?? -1;
    const separator = tokens[tokenIndex + 1];
    const nextToken = tokens[tokenIndex + 2];
    if (!isJoinableSeparator(separator) || nextToken === undefined) continue;
    if (nextToken.type !== 'persian') continue;
    if (isPrefixException(prefix.text, nextToken.text)) continue;
    add({
      start: separator.start,
      end: separator.end,
      replacement: ZWNJ,
      rule: 'prefix',
    });
  }
}

function collectSuffixEdits(
  tokens: readonly Token[],
  words: readonly Token[],
  wordTokenIndices: readonly number[],
  add: (edit: DraftEdit) => void,
): void {
  for (let wi = 0; wi < words.length; wi++) {
    const host = words[wi]!;
    if (host.text.length < 2) continue;
    const suffix = words[wi + 1];
    if (suffix === undefined) continue;
    const separator = tokens[(wordTokenIndices[wi] ?? -1) + 1];
    if (!isJoinableSeparator(separator)) continue;

    if (ZWNJ_SUFFIX_WORDS.includes(suffix.text)) {
      add({
        start: separator.start,
        end: separator.end,
        replacement: ZWNJ,
        rule: 'suffix',
      });
      continue;
    }

    if (ENCLITIC_WORDS.includes(suffix.text)) {
      if (isForbiddenEncliticHost(host.text)) continue;
      const join = encliticJoin(host.text, suffix.text);
      if (join === null) continue;
      if (join === ZWNJ) {
        add({
          start: separator.start,
          end: separator.end,
          replacement: ZWNJ,
          rule: 'enclitic',
        });
      } else {
        // Direct attachment swallows the enclitic token: کتاب+ام → کتابم
        add({
          start: separator.start,
          end: suffix.end,
          replacement: join,
          rule: 'enclitic',
        });
      }
    }
  }
}

/**
 * Join mode for an enclitic after `host`:
 * vowel-final host → ZWNJ («خانه‌ام»)، consonant-final → the elided form that
 * replaces host-space-enclitic («کتاب»+«ام» → «م»، یعنی «کتابم»؛ «بود»+«اند»
 * → «ند»، یعنی «بودند»).
 * Returns null when the pair must be left untouched («ای» after consonants,
 * which protects the vocative particle «سلام ای دوست»).
 */
function encliticJoin(host: string, enclitic: string): string | null {
  if (enclitic === 'ای') {
    return endsWithVowel(host) ? ZWNJ : null;
  }
  return endsWithVowel(host) ? ZWNJ : enclitic.slice(1);
}

/** Apply edits left to right; on overlap the earlier-starting (longest) edit wins. */
export function applyEdits(text: string, edits: readonly DraftEdit[]): string {
  const sorted = [...edits].sort((a, b) => a.start - b.start || b.end - a.end);
  let out = '';
  let pos = 0;
  let appliedEnd = -1;
  for (const edit of sorted) {
    if (edit.start < appliedEnd) continue;
    out += text.slice(pos, edit.start) + edit.replacement;
    pos = edit.end;
    appliedEnd = edit.end;
  }
  return out + text.slice(pos);
}

/**
 * Fix half-spaces in a Persian text: normalize, repair broken ZWNJs, join
 * prefixes (می/نمی/بی), suffixes (ها/تر/ترین/…) and enclitics (خانه‌ام /
 * کتابم), and apply the compound-word dictionary. Idempotent:
 * `fixHalfSpace(fixHalfSpace(x)) === fixHalfSpace(x)`.
 */
export function fixHalfSpace(text: string, options?: FixOptions): string {
  if (typeof text !== 'string') {
    throw new TypeError('fixHalfSpace expects a string');
  }
  const resolved = resolveOptions(options);
  let out = resolved.normalize ? normalizePersian(text) : text;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const edits = collectEdits(out, resolved);
    if (edits.length === 0) break;
    out = applyEdits(out, edits);
  }
  return out;
}
