import { describe, expect, it } from 'vitest';
import { ZWNJ } from '../src/constants.js';

describe('smoke', () => {
  it('ZWNJ constant is U+200C', () => {
    expect(ZWNJ).toHaveLength(1);
    expect(ZWNJ.codePointAt(0)).toBe(0x200c);
  });
});
