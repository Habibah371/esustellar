type Network = 'mainnet' | 'testnet';
type ResourceType = 'tx' | 'account';

const BASE_URLS: Record<Network, string> = {
  mainnet: 'https://stellar.expert/explorer/public',
  testnet: 'https://stellar.expert/explorer/testnet',
};

/** Returns the Stellar Expert URL for the given transaction hash. */
export function txExplorerLink(txHash: string, network: Network = 'mainnet'): string {
  return `${BASE_URLS[network]}/tx/${txHash}`;
}

/** Returns the Stellar Expert URL for the given account address. */
export function accountExplorerLink(address: string, network: Network = 'mainnet'): string {
  return `${BASE_URLS[network]}/account/${address}`;
}

/** Unified helper — builds an explorer URL for any supported resource type. */
export function explorerLink(type: ResourceType, identifier: string, network: Network = 'mainnet'): string {
  return `${BASE_URLS[network]}/${type}/${identifier}`;
}
