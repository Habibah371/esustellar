"use client";

import * as React from "react";
import {
  Contract,
  xdr,
  scValToNative,
  nativeToScVal,
  TransactionBuilder,
  BASE_FEE,
  rpc,
  Account,
} from "@stellar/stellar-sdk";
import { useWallet } from "@/hooks/use-wallet";
import {
  SOROBAN_NETWORK_PASSPHRASE,
  SOROBAN_RPC_URL,
} from "@/config/walletConfig";

export type GroupStatus = "Open" | "Active" | "Completed" | "Paused";
export type MemberStatus =
  | "Active"
  | "PaidCurrentRound"
  | "Overdue"
  | "Defaulted"
  | "ReceivedPayout";
export type Frequency = "Weekly" | "BiWeekly" | "Monthly";

export interface Group {
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

export interface Member {
  address: string;
  joinTimestamp: bigint;
  joinOrder: number;
  status: MemberStatus;
  totalContributed: bigint;
  hasReceivedPayout: boolean;
  payoutRound: number;
}

export interface Contribution {
  member: string;
  amount: bigint;
  round: number;
  timestamp: bigint;
}

export interface Payout {
  recipient: string;
  amount: bigint;
  round: number;
  timestamp: bigint;
}

export interface CreateGroupParams {
  groupId: string;
  name: string;
  contributionAmount: bigint;
  totalMembers: number;
  frequency: Frequency;
  startTimestamp: bigint;
  isPublic: boolean;
}

export interface SavingsContractContextValue {
  // Multi-group methods (canonical API)
  getGroupById: (groupId: string) => Promise<Group>;
  getMemberByGroup: (address: string, groupId: string) => Promise<Member>;
  getMembersByGroup: (groupId: string) => Promise<Member[]>;
  getRoundContributionsByGroup: (
    groupId: string,
    round: number,
  ) => Promise<Contribution[]>;
  getRoundPayoutsByGroup: (groupId: string, round: number) => Promise<Payout[]>;
  getRoundDeadlineByGroup: (groupId: string, round: number) => Promise<bigint>;

  // User and discovery methods
  getUserGroups: (address: string) => Promise<string[]>;
  getAllGroups: () => Promise<string[]>;

  // Transaction methods
  createGroup: (
    params: CreateGroupParams,
  ) => Promise<rpc.Api.GetSuccessfulTransactionResponse>;
  joinGroup: (
    groupId: string,
  ) => Promise<rpc.Api.GetSuccessfulTransactionResponse>;
  // NOTE: contribute does NOT take an amount — the amount is fixed on-chain at group creation
  contribute: (
    groupId: string,
  ) => Promise<rpc.Api.GetSuccessfulTransactionResponse>;

  // Contract info
  contractId: string;
  isReady: boolean;
  error: string | null;
}

const SavingsContractContext = React.createContext<
  SavingsContractContextValue | undefined
>(undefined);

export function SavingsContractProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = useWallet();
  const contractId = process.env.NEXT_PUBLIC_SAVINGS_CONTRACT_ID || "";
  const [error, setError] = React.useState<string | null>(null);

  const isReady = !!contractId && !!SOROBAN_RPC_URL;

  const server = React.useMemo(
    () => new rpc.Server(SOROBAN_RPC_URL, { allowHttp: true }),
    [],
  );

  const simulateCall = React.useCallback(
    async (method: string, ...args: xdr.ScVal[]): Promise<xdr.ScVal> => {
      const source =
        wallet.publicKey ||
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
      const contract = new Contract(contractId);
      const sourceAccount = new Account(source, "0");

      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      const result = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(result)) throw new Error(result.error);
      if (!result.result) throw new Error("Simulation result empty");
      return result.result.retval;
    },
    [wallet.publicKey, contractId, server],
  );

  const sendTransaction = React.useCallback(
    async (method: string, ...args: xdr.ScVal[]) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");

      const contract = new Contract(contractId);
      const account = await server.getAccount(wallet.publicKey);

      let tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: SOROBAN_NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      tx = await server.prepareTransaction(tx);
      const signedXdr = await wallet.signTransaction(tx.toXDR());

      const transactionToSubmit = TransactionBuilder.fromXDR(
        signedXdr,
        SOROBAN_NETWORK_PASSPHRASE,
      );
      const response = await server.sendTransaction(transactionToSubmit);

      if (response.status !== "PENDING") {
        throw new Error(`Transaction failed: ${response.status}`);
      }

      let getResponse = await server.getTransaction(response.hash);
      while (getResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        getResponse = await server.getTransaction(response.hash);
      }

      if (getResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return getResponse;
      }

      let errorMessage = `Transaction failed: ${getResponse.status}`;
      if ("resultXdr" in getResponse) {
        try {
          errorMessage += `\nResult: ${JSON.stringify(getResponse.resultXdr, null, 2)}`;
        } catch (e) {
          console.error("Could not parse result XDR:", e);
        }
      }

      throw new Error(errorMessage);
    },
    [wallet, contractId, server],
  );

  // ===== READ METHODS =====

  const getGroupById = React.useCallback(
    async (groupId: string): Promise<Group> => {
      const res = await simulateCall(
        "get_group",
        nativeToScVal(groupId, { type: "string" }),
      );
      const n = scValToNative(res);

      // Soroban enums deserialize as single-element arrays e.g. ['Open'], ['Monthly']
      const unwrap = (v: unknown) => (Array.isArray(v) ? v[0] : v);

      return {
        groupId: n.group_id ?? n.groupId,
        admin: n.admin,
        name: n.name,
        contributionAmount: BigInt(
          n.contribution_amount ?? n.contributionAmount ?? 0,
        ),
        totalMembers: n.total_members ?? n.totalMembers ?? 0,
        frequency: unwrap(n.frequency),
        startTimestamp: BigInt(n.start_timestamp ?? n.startTimestamp ?? 0),
        status: unwrap(n.status),
        isPublic: n.is_public ?? n.isPublic ?? false,
        currentRound: n.current_round ?? n.currentRound ?? 0,
        platformFeePercent: n.platform_fee_percent ?? n.platformFeePercent ?? 0,
      };
    },
    [simulateCall],
  );

  const getMemberByGroup = React.useCallback(
    async (address: string, groupId: string): Promise<Member> => {
      const res = await simulateCall(
        "get_member",
        nativeToScVal(address, { type: "address" }),
        nativeToScVal(groupId, { type: "string" }),
      );
      const n = scValToNative(res);
      return {
        address: n.address,
        joinTimestamp: BigInt(n.join_timestamp ?? n.joinTimestamp ?? 0),
        joinOrder: n.join_order ?? n.joinOrder ?? 0,
        status: n.status,
        totalContributed: BigInt(
          n.total_contributed ?? n.totalContributed ?? 0,
        ),
        hasReceivedPayout:
          n.has_received_payout ?? n.hasReceivedPayout ?? false,
        payoutRound: n.payout_round ?? n.payoutRound ?? 0,
      };
    },
    [simulateCall],
  );

  const getMembersByGroup = React.useCallback(
    async (groupId: string): Promise<Member[]> => {
      const res = await simulateCall(
        "get_members",
        nativeToScVal(groupId, { type: "string" }),
      );
      const addrs = scValToNative(res) as string[];
      return Promise.all(addrs.map((a) => getMemberByGroup(a, groupId)));
    },
    [simulateCall, getMemberByGroup],
  );

  const getRoundContributionsByGroup = React.useCallback(
    async (groupId: string, round: number): Promise<Contribution[]> => {
      const res = await simulateCall(
        "get_round_contributions",
        nativeToScVal(groupId, { type: "string" }),
        nativeToScVal(round, { type: "u32" }),
      );
      return (scValToNative(res) as any[]).map((c) => ({
        member: c.member,
        amount: BigInt(c.amount ?? 0),
        round: c.round,
        timestamp: BigInt(c.timestamp ?? 0),
      }));
    },
    [simulateCall],
  );

  const getRoundPayoutsByGroup = React.useCallback(
    async (groupId: string, round: number): Promise<Payout[]> => {
      const res = await simulateCall(
        "get_round_payouts",
        nativeToScVal(groupId, { type: "string" }),
        nativeToScVal(round, { type: "u32" }),
      );
      return (scValToNative(res) as any[]).map((p) => ({
        recipient: p.recipient,
        amount: BigInt(p.amount ?? 0),
        round: p.round,
        timestamp: BigInt(p.timestamp ?? 0),
      }));
    },
    [simulateCall],
  );

  const getRoundDeadlineByGroup = React.useCallback(
    async (groupId: string, round: number): Promise<bigint> => {
      const res = await simulateCall(
        "get_round_deadline",
        nativeToScVal(groupId, { type: "string" }),
        nativeToScVal(round, { type: "u32" }),
      );
      return BigInt(scValToNative(res));
    },
    [simulateCall],
  );

  const getUserGroups = React.useCallback(
    async (address: string): Promise<string[]> => {
      try {
        const res = await simulateCall(
          "get_user_groups",
          nativeToScVal(address, { type: "address" }),
        );
        return scValToNative(res) as string[];
      } catch (err: any) {
        if (err.message?.includes("non-existent contract function")) return [];
        throw err;
      }
    },
    [simulateCall],
  );

  const getAllGroups = React.useCallback(async (): Promise<string[]> => {
    try {
      const res = await simulateCall("get_all_groups");
      return scValToNative(res) as string[];
    } catch (err: any) {
      if (err.message?.includes("non-existent contract function")) return [];
      throw err;
    }
  }, [simulateCall]);

  // ===== WRITE METHODS =====

  const createGroup = React.useCallback(
    async (p: CreateGroupParams) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");

      const currentTime = Math.floor(Date.now() / 1000);
      if (Number(p.startTimestamp) <= currentTime) {
        throw new Error(
          `Start timestamp must be in the future. Current: ${currentTime}, Provided: ${p.startTimestamp}`,
        );
      }

      const frequencyScVal = xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol(p.frequency),
      ]);

      return await sendTransaction(
        "create_group",
        nativeToScVal(wallet.publicKey, { type: "address" }),
        nativeToScVal(p.groupId, { type: "string" }),
        nativeToScVal(p.name, { type: "string" }),
        nativeToScVal(p.contributionAmount, { type: "i128" }),
        nativeToScVal(p.totalMembers, { type: "u32" }),
        frequencyScVal,
        nativeToScVal(p.startTimestamp, { type: "u64" }),
        nativeToScVal(p.isPublic, { type: "bool" }),
      );
    },
    [wallet.publicKey, sendTransaction],
  );

  const joinGroup = React.useCallback(
    async (groupId: string) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");

      return await sendTransaction(
        "join_group",
        nativeToScVal(wallet.publicKey, { type: "address" }),
        nativeToScVal(groupId, { type: "string" }),
      );
    },
    [wallet.publicKey, sendTransaction],
  );

  /**
   * Contribute to the current round of a group.
   * The amount is fixed on-chain — do NOT pass an amount here.
   */
  const contribute = React.useCallback(
    async (groupId: string) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");

      return await sendTransaction(
        "contribute",
        nativeToScVal(wallet.publicKey, { type: "address" }),
        nativeToScVal(groupId, { type: "string" }),
      );
    },
    [wallet.publicKey, sendTransaction],
  );

  const value = React.useMemo(
    () => ({
      getGroupById,
      getMemberByGroup,
      getMembersByGroup,
      getRoundContributionsByGroup,
      getRoundPayoutsByGroup,
      getRoundDeadlineByGroup,
      getUserGroups,
      getAllGroups,
      createGroup,
      joinGroup,
      contribute,
      contractId,
      isReady,
      error,
    }),
    [
      getGroupById,
      getMemberByGroup,
      getMembersByGroup,
      getRoundContributionsByGroup,
      getRoundPayoutsByGroup,
      getRoundDeadlineByGroup,
      getUserGroups,
      getAllGroups,
      createGroup,
      joinGroup,
      contribute,
      contractId,
      isReady,
      error,
    ],
  );

  return (
    <SavingsContractContext.Provider value={value}>
      {children}
    </SavingsContractContext.Provider>
  );
}

export const useSavingsContract = () => {
  const ctx = React.useContext(SavingsContractContext);
  if (!ctx)
    throw new Error(
      "useSavingsContract must be used within SavingsContractProvider",
    );
  return ctx;
};
