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
  /** Savings contract ID (Stellar address). */
  contractId: string;
  /** Soroban RPC endpoint URL. */
  rpcUrl: string;
  /** Network passphrase, e.g. "Test SDF Network ; September 2015". */
  networkPassphrase: string;
  /** Optional Stellar address used as the simulation source. Defaults to a dummy account. */
  sourceAccount?: string;
}

/** Mirrors the `Payout` struct from the Savings contract. */
export interface Payout {
  recipient: string;
  amount: bigint;
  round: number;
  timestamp: bigint;
}

/**
 * Retrieves all payouts distributed in a specific round for a group.
 *
 * This is a read-only simulation — no transaction is submitted and no auth is required.
 *
 * @throws {Error} If the group is not found, the simulation fails, or the result is empty.
 *
 * @example
 * ```ts
 * const payouts = await getRoundPayouts(
 *   { contractId, rpcUrl, networkPassphrase },
 *   "ajo-001",
 *   1,
 * );
 * console.log(payouts[0].recipient);
 * ```
 */
export async function getRoundPayouts(
  config: SdkConfig,
  groupId: string,
  round: number,
): Promise<Payout[]> {
  const { contractId, rpcUrl, networkPassphrase } = config;
  const source = config.sourceAccount ?? DUMMY_ACCOUNT;

  const server = new rpc.Server(rpcUrl, { allowHttp: true });
  const contract = new Contract(contractId);
  const account = new Account(source, "0");

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(
      contract.call(
        "get_round_payouts",
        nativeToScVal(groupId, { type: "string" }),
        nativeToScVal(round, { type: "u32" }),
      ),
    )
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx as any);

  if (rpc.Api.isSimulationError(result)) {
    const errMsg = (result as any).error as string;
    if (errMsg?.includes("#2") || errMsg?.toLowerCase().includes("not found") || errMsg?.toLowerCase().includes("invalid round")) {
      throw new Error(`GroupNotFound: no group registered at ${groupId}`);
    }
    throw new Error(`Savings contract simulation error: ${errMsg}`);
  }

  const simResult = result as any;
  if (!simResult.result?.retval) {
    throw new Error("Simulation returned empty result");
  }

  const raw = scValToNative(simResult.result.retval) as Array<{
    recipient: string;
    amount: bigint | number | string;
    round: number;
    timestamp: bigint | number | string;
  }>;

  return raw.map((p) => {
    const amount = typeof p.amount === "bigint" ? p.amount : BigInt(p.amount as any);
    const timestamp = typeof p.timestamp === "bigint" ? p.timestamp : BigInt(p.timestamp as any);
    return {
      recipient: String(p.recipient),
      amount,
      round: Number(p.round),
      timestamp,
    };
  });
}
