import {
  Contract,
  nativeToScVal,
  TransactionBuilder,
  BASE_FEE,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";

export type Frequency = "Weekly" | "BiWeekly" | "Monthly";
export type GroupStatus = "Open" | "Active" | "Completed" | "Paused";

export interface SdkConfig {
  /** Savings contract ID (Stellar address). */
  contractId: string;
  /** Soroban RPC endpoint URL. */
  rpcUrl: string;
  /** Network passphrase, e.g. "Test SDF Network ; September 2015". */
  networkPassphrase: string;
}

export interface WriteConfig extends SdkConfig {
  /** Caller's Stellar public key — must be the group admin. */
  publicKey: string;
  /** Callback that signs the transaction XDR and returns the signed XDR string. */
  signTransaction: (xdr: string) => Promise<string>;
}

export interface CreateGroupParams {
  /** Admin Stellar address — auto-joins and requires auth. */
  admin: string;
  /** Unique identifier for this group (on-chain string key). */
  groupId: string;
  /** Human-readable name. */
  name: string;
  /** Contribution amount in stroops (minimum 10_000_000 = 10 XLM). */
  contributionAmount: bigint;
  /** Number of members — must be between 3 and 20 inclusive. */
  totalMembers: number;
  /** Round cadence. */
  frequency: Frequency;
  /** Unix timestamp (seconds) for when the first round starts — must be in the future. */
  startTimestamp: bigint;
  /** Whether the group appears in public discovery listings. */
  isPublic: boolean;
}

/** Mirrors the `SavingsGroup` struct returned by `create_group`. */
export interface SavingsGroup {
  groupId: string;
  admin: string;
  name: string;
  contributionAmount: bigint;
  totalMembers: number;
  frequency: Frequency;
  startTimestamp: bigint;
  status: GroupStatus;
  isPublic: boolean;
  currentRound: number;
  platformFeePercent: number;
}

/**
 * Creates a new savings group on-chain.
 *
 * The caller must be the group admin and provide a `signTransaction` callback.
 * The admin is automatically added as the first member on-chain.
 *
 * **Error variants surfaced by the contract:**
 * - `ContributionTooLow` — `contributionAmount` < 10 XLM (10_000_000 stroops)
 * - `InvalidMemberCount` — `totalMembers` not in [3, 20]
 * - `StartDateMustBeFuture` — `startTimestamp` ≤ current ledger timestamp
 *
 * @throws {Error} On contract validation failure, transaction rejection, or RPC error.
 *
 * @example
 * ```ts
 * const result = await createGroup(
 *   { contractId, rpcUrl, networkPassphrase, publicKey, signTransaction },
 *   {
 *     admin: publicKey,
 *     groupId: "ajo-001",
 *     name: "Lagos Ajo Circle",
 *     contributionAmount: 50_000_000n,
 *     totalMembers: 6,
 *     frequency: "Monthly",
 *     startTimestamp: BigInt(Math.floor(Date.now() / 1000) + 86400),
 *     isPublic: true,
 *   },
 * );
 * ```
 */
export async function createGroup(
  config: WriteConfig,
  params: CreateGroupParams,
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const { contractId, rpcUrl, networkPassphrase, publicKey, signTransaction } = config;

  const server = new rpc.Server(rpcUrl, { allowHttp: true });
  const contract = new Contract(contractId);
  const account = await server.getAccount(publicKey);

  // Soroban enum variant must be encoded as a single-element Vec<Symbol>.
  const frequencyScVal = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(params.frequency)]);

  let tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(
      contract.call(
        "create_group",
        nativeToScVal(params.admin, { type: "address" }),
        nativeToScVal(params.groupId, { type: "string" }),
        nativeToScVal(params.name, { type: "string" }),
        nativeToScVal(params.contributionAmount, { type: "i128" }),
        nativeToScVal(params.totalMembers, { type: "u32" }),
        frequencyScVal,
        nativeToScVal(params.startTimestamp, { type: "u64" }),
        nativeToScVal(params.isPublic, { type: "bool" }),
      ),
    )
    .setTimeout(30)
    .build();

  tx = await server.prepareTransaction(tx as any);

  const signedXdr = await signTransaction((tx as any).toXDR());
  const preparedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

  const sendResp = await server.sendTransaction(preparedTx as any);
  if (sendResp.status !== "PENDING") {
    throw new Error(`Transaction not accepted by network: ${sendResp.status}`);
  }

  let getResp = await server.getTransaction(sendResp.hash);
  while (getResp.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1000));
    getResp = await server.getTransaction(sendResp.hash);
  }

  if (getResp.status === rpc.Api.GetTransactionStatus.SUCCESS) {
    return getResp as rpc.Api.GetSuccessfulTransactionResponse;
  }

  throw new Error(`create_group transaction failed: ${getResp.status}`);
}
