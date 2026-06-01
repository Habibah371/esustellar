import {
  Contract,
  nativeToScVal,
  TransactionBuilder,
  BASE_FEE,
  rpc,
} from "@stellar/stellar-sdk";

export interface SdkConfig {
  /** Savings contract ID (Stellar address). */
  contractId: string;
  /** Soroban RPC endpoint URL. */
  rpcUrl: string;
  /** Network passphrase, e.g. "Test SDF Network ; September 2015". */
  networkPassphrase: string;
}

export interface WriteConfig extends SdkConfig {
  /** Stellar public key of the contributing member. */
  publicKey: string;
  /** Callback that signs the transaction XDR and returns the signed XDR string. */
  signTransaction: (xdr: string) => Promise<string>;
}

/**
 * Records the caller's contribution for the current round of a savings group.
 *
 * The contribution amount is fixed on-chain at group creation — no amount
 * parameter is accepted here.
 *
 * **Error variants surfaced by the contract:**
 * - `GroupNotFound` — no group exists for the given `groupId`
 * - `GroupNotActive` — group is not in `Active` status (rounds not yet started or completed)
 * - `NotMember` — caller is not a member of this group
 * - `MemberDefaulted` — caller has previously defaulted and cannot contribute
 * - `AlreadyPaidThisRound` — caller has already contributed in the current round
 * - `PaymentWindowClosed` — the grace period for this round has expired
 *
 * @throws {Error} On contract validation failure, transaction rejection, or RPC error.
 *
 * @example
 * ```ts
 * await contribute(
 *   { contractId, rpcUrl, networkPassphrase, publicKey, signTransaction },
 *   "ajo-001",
 * );
 * ```
 */
export async function contribute(
  config: WriteConfig,
  groupId: string,
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const { contractId, rpcUrl, networkPassphrase, publicKey, signTransaction } = config;

  const server = new rpc.Server(rpcUrl, { allowHttp: true });
  const contract = new Contract(contractId);
  const account = await server.getAccount(publicKey);

  let tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(
      contract.call(
        "contribute",
        nativeToScVal(publicKey, { type: "address" }),
        nativeToScVal(groupId, { type: "string" }),
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

  throw new Error(`contribute transaction failed: ${getResp.status}`);
}
