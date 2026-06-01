import {
  Contract,
  scValToNative,
  TransactionBuilder,
  BASE_FEE,
  rpc,
  Account,
} from "@stellar/stellar-sdk";

const DUMMY_ACCOUNT =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export interface SdkConfig {
  /** Registry contract ID (Stellar address). */
  contractId: string;
  /** Soroban RPC endpoint URL. */
  rpcUrl: string;
  /** Network passphrase, e.g. "Test SDF Network ; September 2015". */
  networkPassphrase: string;
  /** Optional Stellar address used as the simulation source. Defaults to a dummy account. */
  sourceAccount?: string;
}

/** Mirrors the `GroupInfo` struct from the Registry contract. */
export interface GroupInfo {
  contractAddress: string;
  groupId: string;
  name: string;
  admin: string;
  isPublic: boolean;
  /** Unix timestamp (seconds) when the group was registered. */
  createdAt: number;
  totalMembers: number;
}

/**
 * Returns full `GroupInfo` for all **public** groups registered in the Registry contract.
 * Private groups (`is_public: false`) are excluded by the contract itself.
 *
 * This is a read-only simulation — no transaction is submitted and no auth is required.
 *
 * @throws {Error} If the simulation fails or returns an empty result.
 *
 * @example
 * ```ts
 * const publicGroups = await getAllPublicGroups({
 *   contractId: "CREGISTRY...",
 *   rpcUrl: "https://soroban-testnet.stellar.org",
 *   networkPassphrase: "Test SDF Network ; September 2015",
 * });
 * // All returned groups are guaranteed to have isPublic === true
 * ```
 */
export async function getAllPublicGroups(
  config: SdkConfig,
): Promise<GroupInfo[]> {
  const { contractId, rpcUrl, networkPassphrase } = config;
  const source = config.sourceAccount ?? DUMMY_ACCOUNT;

  const server = new rpc.Server(rpcUrl, { allowHttp: true });
  const contract = new Contract(contractId);
  const account = new Account(source, "0");

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(contract.call("get_all_public_groups"))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx as any);

  if (rpc.Api.isSimulationError(result)) {
    throw new Error(
      `Registry contract simulation error: ${(result as any).error}`,
    );
  }

  const simResult = result as any;
  if (!simResult.result?.retval) {
    throw new Error("Simulation returned empty result");
  }

  const raw = scValToNative(simResult.result.retval) as Array<{
    contract_address: string;
    group_id: string;
    name: string;
    admin: string;
    is_public: boolean;
    created_at: bigint | number;
    total_members: number;
  }>;

  return raw.map((g) => ({
    contractAddress: String(g.contract_address),
    groupId: String(g.group_id),
    name: String(g.name),
    admin: String(g.admin),
    isPublic: Boolean(g.is_public),
    createdAt: Number(g.created_at),
    totalMembers: Number(g.total_members),
  }));
}
