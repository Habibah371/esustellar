import { formatXLM } from '@/utils/stellar';

describe('formatXLM', () => {
  // ─── Integer amounts ─────────────────────────────────────────────────────

  it('formats a whole-number XLM amount without decimal places', () => {
    expect(formatXLM(100)).toBe('100 XLM');
  });

  it('formats 1 XLM correctly', () => {
    expect(formatXLM(1)).toBe('1 XLM');
  });

  it('formats large whole numbers with comma separators', () => {
    expect(formatXLM(1_000_000)).toBe('1,000,000 XLM');
  });

  // ─── Decimal amounts ─────────────────────────────────────────────────────

  it('formats a decimal amount preserving significant fractional digits', () => {
    expect(formatXLM(1.5)).toBe('1.5 XLM');
  });

  it('formats an amount with 7 decimal places (maximum XLM precision)', () => {
    expect(formatXLM(0.1234567)).toBe('0.1234567 XLM');
  });

  it('trims trailing zeroes from decimal amounts', () => {
    expect(formatXLM(1.5000000)).toBe('1.5 XLM');
  });

  it('formats a typical transaction amount correctly', () => {
    expect(formatXLM(99.999)).toBe('99.999 XLM');
  });

  // ─── Very small amounts ───────────────────────────────────────────────────

  it('formats the smallest possible XLM unit (1 stroop = 0.0000001 XLM)', () => {
    expect(formatXLM(0.0000001)).toBe('0.0000001 XLM');
  });

  it('formats a dust amount without losing precision', () => {
    expect(formatXLM(0.0000050)).toBe('0.000005 XLM');
  });

  // ─── Zero ─────────────────────────────────────────────────────────────────

  it('formats 0 as "0 XLM"', () => {
    expect(formatXLM(0)).toBe('0 XLM');
  });

  it('formats 0.0 as "0 XLM" (no trailing decimal)', () => {
    expect(formatXLM(0.0)).toBe('0 XLM');
  });

  // ─── Negative values ─────────────────────────────────────────────────────

  it('formats a negative integer with a leading minus sign', () => {
    expect(formatXLM(-50)).toBe('-50 XLM');
  });

  it('formats a negative decimal correctly', () => {
    expect(formatXLM(-0.5)).toBe('-0.5 XLM');
  });

  it('formats negative zero as "0 XLM"', () => {
    expect(formatXLM(-0)).toBe('0 XLM');
  });

  // ─── String / raw stroops input (if overload is supported) ───────────────

  it('accepts a numeric string and formats it correctly', () => {
    // Remove or adjust this test if formatXLM is strictly typed to `number`
    expect(formatXLM('25.5' as any)).toBe('25.5 XLM');
  });

  // ─── Boundary / special values ────────────────────────────────────────────

  it('does not throw on Number.MAX_SAFE_INTEGER', () => {
    expect(() => formatXLM(Number.MAX_SAFE_INTEGER)).not.toThrow();
  });

  it('does not return NaN in the output for a valid number', () => {
    expect(formatXLM(42)).not.toContain('NaN');
  });

  it('appends the XLM ticker to every output', () => {
    for (const amount of [0, 1, 100, 0.0000001, -1]) {
      expect(formatXLM(amount)).toMatch(/XLM$/);
    }
  });
});