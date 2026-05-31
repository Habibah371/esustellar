import { txExplorerLink, accountExplorerLink } from '@/utils/explorerLink';

// ─── Constants (mirror what your util uses internally) ────────────────────────

const MAINNET_BASE  = 'https://stellar.expert/explorer/public';
const TESTNET_BASE  = 'https://stellar.expert/explorer/testnet';

const SAMPLE_TX   = 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1';
const SAMPLE_ADDR = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW';

// ─── Transaction links ────────────────────────────────────────────────────────

describe('explorerLink — transactions', () => {
  it('returns the correct mainnet transaction URL', () => {
    const url = explorerLink('tx', SAMPLE_TX, 'mainnet');
    expect(url).toBe(`${MAINNET_BASE}/tx/${SAMPLE_TX}`);
  });

  it('returns the correct testnet transaction URL', () => {
    const url = explorerLink('tx', SAMPLE_TX, 'testnet');
    expect(url).toBe(`${TESTNET_BASE}/tx/${SAMPLE_TX}`);
  });

  it('defaults to mainnet when no network is specified', () => {
    const url = explorerLink('tx', SAMPLE_TX);
    expect(url).toBe(`${MAINNET_BASE}/tx/${SAMPLE_TX}`);
  });

  it('includes the full transaction hash in the URL', () => {
    const url = explorerLink('tx', SAMPLE_TX, 'mainnet');
    expect(url).toContain(SAMPLE_TX);
  });
});

// ─── Account / address links ──────────────────────────────────────────────────

describe('explorerLink — accounts', () => {
  it('returns the correct mainnet account URL', () => {
    const url = explorerLink('account', SAMPLE_ADDR, 'mainnet');
    expect(url).toBe(`${MAINNET_BASE}/account/${SAMPLE_ADDR}`);
  });

  it('returns the correct testnet account URL', () => {
    const url = explorerLink('account', SAMPLE_ADDR, 'testnet');
    expect(url).toBe(`${TESTNET_BASE}/account/${SAMPLE_ADDR}`);
  });

  it('includes the full address in the URL without truncation', () => {
    const url = explorerLink('account', SAMPLE_ADDR, 'mainnet');
    expect(url).toContain(SAMPLE_ADDR);
  });
});

// ─── URL structure ────────────────────────────────────────────────────────────

describe('explorerLink — URL structure', () => {
  it('returns a valid URL string (no spaces or illegal characters)', () => {
    const url = explorerLink('tx', SAMPLE_TX, 'mainnet');
    expect(() => new URL(url)).not.toThrow();
  });

  it('uses HTTPS for mainnet links', () => {
    const url = explorerLink('tx', SAMPLE_TX, 'mainnet');
    expect(url.startsWith('https://')).toBe(true);
  });

  it('uses HTTPS for testnet links', () => {
    const url = explorerLink('tx', SAMPLE_TX, 'testnet');
    expect(url.startsWith('https://')).toBe(true);
  });

  it('does not contain a double slash in the path (no trailing slash on base)', () => {
    const url = explorerLink('tx', SAMPLE_TX, 'mainnet');
    // e.g. "https://stellar.expert//tx/..." would be a bug
    expect(url).not.toMatch(/([^:])\/\//);
  });

  it('mainnet and testnet URLs for the same resource are different', () => {
    const mainnet = explorerLink('tx', SAMPLE_TX, 'mainnet');
    const testnet = explorerLink('tx', SAMPLE_TX, 'testnet');
    expect(mainnet).not.toBe(testnet);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('explorerLink — edge cases', () => {
  it('does not throw when given an empty identifier', () => {
    expect(() => explorerLink('tx', '', 'mainnet')).not.toThrow();
  });

  it('returns a string for every supported resource type', () => {
    const types = ['tx', 'account'] as const;
    for (const type of types) {
      expect(typeof explorerLink(type, SAMPLE_TX, 'mainnet')).toBe('string');
    }
  });

  it('handles an unusually long identifier without throwing', () => {
    const longId = 'A'.repeat(200);
    expect(() => explorerLink('tx', longId, 'testnet')).not.toThrow();
  });

  it('does not mutate the identifier (no encoding that changes alphanumeric chars)', () => {
    const url = explorerLink('account', SAMPLE_ADDR, 'mainnet');
    // Stellar addresses are alphanumeric — they should not be percent-encoded
    expect(url).toContain(SAMPLE_ADDR);
  });
});