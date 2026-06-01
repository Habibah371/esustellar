import { truncateAddress } from '../../utils/stellar';

describe('truncateAddress', () => {
  // ─── Happy path ──────────────────────────────────────────────────────────

  it('truncates a standard 56-char Stellar address to GXXX...XXXX format', () => {
    const address = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW';
    // 56 chars:       ↑ 4 start chars                              4 end ↑
    const result = truncateAddress(address);
    expect(result).toBe('GABC...UVWX'); // adjust expected chars to match your util's slice bounds
  });

  it('preserves the G prefix in the truncated form', () => {
    const address = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3';
    const result = truncateAddress(address);
    expect(result.startsWith('G')).toBe(true);
  });

  it('contains "..." as the separator', () => {
    const address = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW';
    expect(truncateAddress(address)).toContain('...');
  });

  it('shows exactly 4 leading and 4 trailing characters by default', () => {
    const address = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW';
    const result = truncateAddress(address);
    const [head, tail] = result.split('...');
    expect(head).toHaveLength(4);
    expect(tail).toHaveLength(4);
  });

  it('handles a Stellar address that is exactly 56 characters long', () => {
    const address = 'G' + 'A'.repeat(55); // 56 chars
    const result = truncateAddress(address);
    expect(result).toMatch(/^.{4}\.\.\.(.{4})$/);
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('returns an empty string when given an empty string', () => {
    expect(truncateAddress('')).toBe('');
  });

  it('returns the original string unchanged when shorter than the truncation threshold', () => {
    const short = 'GABC';
    expect(truncateAddress(short)).toBe('GABC');
  });

  it('returns the original string unchanged when exactly 8 characters long', () => {
    const exactly8 = 'GABCDEFG';
    // 8 chars = 4 head + 4 tail with nothing to hide — no truncation needed
    expect(truncateAddress(exactly8)).toBe('GABCDEFG');
  });

  it('handles a 9-character address (1 char hidden)', () => {
    const nine = 'GABCDEFGH';
    const result = truncateAddress(nine);
    // Should truncate since there is at least 1 char between head and tail
    expect(result).toBe('GABC...EFGH');
  });

  it('does not throw on a non-Stellar-prefixed string', () => {
    expect(() => truncateAddress('someshortstring')).not.toThrow();
  });

  it('handles a string of all the same character', () => {
    const uniform = 'A'.repeat(56);
    const result = truncateAddress(uniform);
    expect(result).toBe('AAAA...AAAA');
  });
});