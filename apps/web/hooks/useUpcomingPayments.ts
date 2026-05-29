import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useRegistryContract } from "@/context/registryContract";
import { useSavingsContract } from "@/context/savingsContract";
import { getUrgencyLevel, sortPayments } from "@/lib/paymentDeadlines";
import type { PaymentInfo } from "@/lib/paymentDeadlines";

const STROOPS_PER_XLM = 10_000_000;
const SECONDS_PER_DAY = 86_400;

function unwrapEnum(value: unknown): string {
  return Array.isArray(value) ? String(value[0]) : String(value);
}

function getDaysRemaining(deadline: number): number {
  const nowTs = Math.floor(Date.now() / 1000);
  return Math.ceil((deadline - nowTs) / SECONDS_PER_DAY);
}

export function useUpcomingPayments() {
  const { publicKey, isConnected } = useWallet();
  const registry = useRegistryContract();
  const savings = useSavingsContract();

  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payingGroupId, setPayingGroupId] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!isConnected || !publicKey || !registry.isReady || !savings.isReady) {
      setPayments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contractAddresses = await registry.getUserGroups(publicKey);

      if (!contractAddresses || contractAddresses.length === 0) {
        setPayments([]);
        return;
      }

      const results = await Promise.all(
        contractAddresses.map(async (contractAddress) => {
          try {
            const groupInfo = await registry.getGroupInfo(contractAddress);
            const group = await savings.getGroupById(groupInfo.group_id);

            if (unwrapEnum(group.status) !== "Active") return null;

            const member = await savings.getMemberByGroup(
              publicKey,
              groupInfo.group_id,
            );

            if (unwrapEnum(member.status) !== "Active") return null;

            const deadline = Number(
              await savings.getRoundDeadlineByGroup(
                groupInfo.group_id,
                group.currentRound,
              ),
            );
            const daysRemaining = getDaysRemaining(deadline);

            return {
              groupName: group.name || groupInfo.name,
              groupId: groupInfo.group_id,
              contractAddress,
              amountXLM: Number(group.contributionAmount) / STROOPS_PER_XLM,
              deadline,
              daysRemaining,
              urgency: getUrgencyLevel(daysRemaining),
              inGracePeriod: false,
              graceDaysRemaining: 0,
            } as PaymentInfo;
          } catch {
            return null;
          }
        }),
      );

      const valid = results.filter((p): p is PaymentInfo => p !== null);
      setPayments(sortPayments(valid));
    } catch {
      setError("Failed to load upcoming payments.");
    } finally {
      setLoading(false);
    }
  }, [isConnected, publicKey, registry, savings]);

  const payNow = useCallback(
    async (groupId: string) => {
      if (!isConnected || !publicKey) throw new Error("Wallet not connected");

      setPayingGroupId(groupId);
      try {
        await savings.contribute(groupId);
        setPayments((current) =>
          current.filter((payment) => payment.groupId !== groupId),
        );
      } finally {
        setPayingGroupId(null);
      }
    },
    [isConnected, publicKey, savings],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPayments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    payingGroupId,
    payNow,
    refetch: fetchPayments,
  };
}
