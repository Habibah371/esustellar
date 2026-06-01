import {
  Contract,
  nativeToScVal,
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
 * Retrieves all registry metadata for a single group by its contract address.
 *
 * This is a read-only simulation — no transaction is submitted and no auth is required.
 *
 * **Error variants surfaced by the contract:**
 * - `GroupNotFound` — no group is registered at `contractAddress`
 *
 * @throws {Error} If the group is not found, the simulation fails, or the result is empty.
 *
 * @example
 * ```ts
 * const info = await getGroupInfo({
 *   contractId: "CREGISTRY...",
 *   rpcUrl: "https://soroban-testnet.stellar.org",
 *   networkPassphrase: "Test SDF Network ; September 2015",
 * }, "CSAVINGSCONTRACT...");
 * console.log(info.name); // "My Ajo Circle"
 * ```
 */
export async function getGroupInfo(
  config: SdkConfig,
  contractAddress: string,
): Promise<GroupInfo> {
  const { contractId, rpcUrl, networkPassphrase } = config;
  const source = config.sourceAccount ?? DUMMY_ACCOUNT;

  const server = new rpc.Server(rpcUrl, { allowHttp: true });
  const contract = new Contract(contractId);
  const account = new Account(source, "0");

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(
      contract.call(
        "get_group_info",
        nativeToScVal(contractAddress, { type: "address" }),
      ),
    )
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx as any);

  if (rpc.Api.isSimulationError(result)) {
    const errMsg = (result as any).error as string;
    if (errMsg?.includes("#2") || errMsg?.toLowerCase().includes("not found")) {
      throw new Error(`GroupNotFound: no group registered at ${contractAddress}`);
    }
    throw new Error(`Registry contract simulation error: ${errMsg}`);
  }

  const simResult = result as any;
  if (!simResult.result?.retval) {
    throw new Error("Simulation returned empty result");
  }

  const g = scValToNative(simResult.result.retval) as {
    contract_address: string;
    group_id: string;
    name: string;
    admin: string;
    is_public: boolean;
    created_at: bigint | number;
    total_members: number;
  };

  return {
    contractAddress: String(g.contract_address),
    groupId: String(g.group_id),
    name: String(g.name),
    admin: String(g.admin),
    isPublic: Boolean(g.is_public),
    createdAt: Number(g.created_at),
    totalMembers: Number(g.total_members),
  };
}
