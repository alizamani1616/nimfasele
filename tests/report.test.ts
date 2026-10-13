import { describe, expect, it } from 'vitest';
import { ZWNJ } from '../src/constants.js';
import { fixHalfSpace } from '../src/engine.js';
import { findHalfSpaceIssues, hasHalfSpaceIssue } from '../src/report.js';

describe('findHalfSpaceIssues — positions', () => {
  it('reports a prefix issue with exact offsets', () => {
    const text = 'من می روم';
    const issues = findHalfSpaceIssues(text);
    expect(issues).toHaveLength(1);
    const issue = issues[0]!;
    expect(issue.rule).toBe('prefix');
    // the space between می and روم
    expect(issue.start).toBe(5);
    expect(issue.end).toBe(6);
    expect(issue.original).toBe(' ');
    expect(issue.suggestion).toBe(ZWNJ);
    expect(text.slice(issue.start, issue.end)).toBe(issue.original);
  });

  it('reports suffix, enclitic, compound and cleanup rules with correct tags', () => {
    expect(findHalfSpaceIssues('کتاب ها')[0]!.rule).toBe('suffix');
    expect(findHalfSpaceIssues('خانه ام')[0]!.rule).toBe('enclitic');
    expect(findHalfSpaceIssues('راه آهن')[0]!.rule).toBe('compound');
    expect(findHalfSpaceIssues('کتاب‌،')[0]!.rule).toBe('cleanup');
  });

  it('maps issues exactly onto the original string for a mixed text', () => {
    const text = 'می رفت و کتاب های او را برد. علي https://x.com?a=1';
    for (const issue of findHalfSpaceIssues(text)) {
      expect(text.slice(issue.start, issue.end)).toBe(issue.original);
    }
  });

  it('sorts issues by position', () => {
    const text = 'می روم به راه آهن با کتاب ها';
    const starts = findHalfSpaceIssues(text).map((i) => i.start);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it('returns no issues for clean text', () => {
    expect(findHalfSpaceIssues('می‌روم به راه‌آهن با کتاب‌ها')).toEqual([]);
  });

  it('does not report normalization-only differences (indexes stay valid)', () => {
    const text = 'علي رفت';
    expect(findHalfSpaceIssues(text)).toEqual([]);
  });

  it('empty input has no issues', () => {
    expect(findHalfSpaceIssues('')).toEqual([]);
    expect(hasHalfSpaceIssue('')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(() => findHalfSpaceIssues(5 as unknown as string)).toThrow(TypeError);
    expect(() => hasHalfSpaceIssue(null as unknown as string)).toThrow(TypeError);
  });

  it('respects options (compounds off skips compound issues)', () => {
    expect(hasHalfSpaceIssue('راه آهن', { compounds: false })).toBe(false);
    expect(hasHalfSpaceIssue('راه آهن')).toBe(true);
  });
});

describe('hasHalfSpaceIssue', () => {
  it('detects the classic cases', () => {
    expect(hasHalfSpaceIssue('کتاب ها')).toBe(true);
    expect(hasHalfSpaceIssue('می کرد')).toBe(true);
    expect(hasHalfSpaceIssue('کتاب‌ها')).toBe(false);
  });
});

describe('fixHalfSpace consistency with the report', () => {
  it('applying every suggestion reproduces the fixed text (single pass cases)', () => {
    const samples = [
      'کتاب های من',
      'خانه ام رفت',
      'راه آهن طویل بود',
      'گفت: ‌سلام و رفت',
      'کتاب‌، ماند',
      'می روم و بزرگ ترین می شوم',
    ];
    for (const text of samples) {
      const fixed = fixHalfSpace(text);
      const issues = findHalfSpaceIssues(text);
      // Rebuild the text by replacing issue ranges right to left.
      let rebuilt = text;
      for (const issue of [...issues].sort((a, b) => b.start - a.start)) {
        rebuilt =
          rebuilt.slice(0, issue.start) + issue.suggestion + rebuilt.slice(issue.end);
      }
      expect(rebuilt).toBe(fixed);
    }
  });
});
