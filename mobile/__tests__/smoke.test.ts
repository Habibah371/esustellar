import { txExplorerLink } from '@/utils/explorerLink';

describe('smoke', () => {
  it('test environment works', () => {
    expect(1 + 1).toBe(2);
  });

  it('resolves @/ path alias in tests', () => {
    expect(txExplorerLink('abc123', 'testnet')).toContain(
      'https://stellar.expert/explorer/testnet/tx/abc123',
    );
  });
});
