const { Contract, nativeToScVal, scValToNative, xdr, TransactionBuilder, BASE_FEE, rpc, Account } = require("@stellar/stellar-sdk");

function unwrapEnum(value) {
  return Array.isArray(value) ? value[0] : value;
}

function createSavingsSdk({ contractId, networkPassphrase, rpcUrl, sourceAccount = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF" }) {
  if (!contractId) throw new Error("contractId is required");
  if (!networkPassphrase) throw new Error("networkPassphrase is required");
  if (!rpcUrl) throw new Error("rpcUrl is required");

  const server = new rpc.Server(rpcUrl, { allowHttp: true });
  const contract = new Contract(contractId);

  async function simulate(method, ...args) {
    const tx = new TransactionBuilder(new Account(sourceAccount, "0"), {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(result)) throw new Error(result.error);
    if (!result.result) throw new Error("Simulation result empty");
    return result.result.retval;
  }

  return {
    async getGroup(groupId) {
      const res = await simulate(
        "get_group",
        nativeToScVal(groupId, { type: "string" }),
      );
      const n = scValToNative(res);
      return {
        groupId: n.group_id ?? n.groupId,
        admin: n.admin,
        name: n.name,
        contributionAmount: BigInt(
          n.contribution_amount ?? n.contributionAmount ?? 0,
        ),
        totalMembers: n.total_members ?? n.totalMembers ?? 0,
        frequency: unwrapEnum(n.frequency),
        startTimestamp: BigInt(n.start_timestamp ?? n.startTimestamp ?? 0),
        status: unwrapEnum(n.status),
        isPublic: n.is_public ?? n.isPublic ?? false,
        currentRound: n.current_round ?? n.currentRound ?? 0,
        platformFeePercent: n.platform_fee_percent ?? n.platformFeePercent ?? 0,
      };
    },
    async getMember(member, groupId) {
      const res = await simulate(
        "get_member",
        nativeToScVal(member, { type: "address" }),
        nativeToScVal(groupId, { type: "string" }),
      );
      const n = scValToNative(res);
      return {
        address: n.address,
        joinTimestamp: BigInt(n.join_timestamp ?? n.joinTimestamp ?? 0),
        joinOrder: n.join_order ?? n.joinOrder ?? 0,
        status: unwrapEnum(n.status),
        totalContributed: BigInt(n.total_contributed ?? n.totalContributed ?? 0),
        hasReceivedPayout: n.has_received_payout ?? n.hasReceivedPayout ?? false,
        payoutRound: n.payout_round ?? n.payoutRound ?? 0,
      };
    },
    async getMembers(groupId) {
      const res = await simulate(
        "get_members",
        nativeToScVal(groupId, { type: "string" }),
      );
      return scValToNative(res);
    },
    async getRoundContributions(groupId, round) {
      const res = await simulate(
        "get_round_contributions",
        nativeToScVal(groupId, { type: "string" }),
        nativeToScVal(round, { type: "u32" }),
      );
      return (scValToNative(res) ?? []).map((c) => ({
        member: c.member,
        amount: BigInt(c.amount ?? 0),
        round: c.round,
        timestamp: BigInt(c.timestamp ?? 0),
      }));
    },
    async getUserGroups(user) {
      const res = await simulate(
        "get_user_groups",
        nativeToScVal(user, { type: "address" }),
      );
      return scValToNative(res);
    },
  };
}

module.exports = { createSavingsSdk };
