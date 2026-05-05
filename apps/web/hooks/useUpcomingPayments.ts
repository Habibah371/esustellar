import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useRegistryContract } from "@/context/registryContract";
import { useSavingsContract } from "@/context/savingsContract";
import {
  buildPaymentInfo,
  sortPayments,
  GRACE_PERIOD,
} from "@/lib/paymentDeadlines";
import type { PaymentInfo } from "@/lib/paymentDeadlines";

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
        setLoading(false);
        return;
      }

      const nowTs = Math.floor(Date.now() / 1000);

      const results = await Promise.all(
        contractAddresses.map(async (contractAddress) => {
          try {
            const groupInfo = await registry.getGroupInfo(contractAddress);
            const group = await savings.getGroupById(groupInfo.group_id);

            // Only active or open groups have upcoming payments
            if (group.status !== "Active" && group.status !== "Open")
              return null;

            const member = await savings.getMemberByGroup(
              publicKey,
              groupInfo.group_id,
            );

            // Skip if already paid or defaulted
            if (
              member.status === "PaidCurrentRound" ||
              member.status === "Defaulted"
            )
              return null;

            const payment = buildPaymentInfo(
              groupInfo.name,
              groupInfo.group_id,
              contractAddress,
              group.contributionAmount,
              Number(group.startTimestamp),
              group.currentRound,
              group.frequency,
            );

            // Exclude if past deadline + grace period
            if (nowTs >= payment.deadline + GRACE_PERIOD) return null;

            return payment;
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
    async (groupId: string, amountXLM: number) => {
      if (!isConnected || !publicKey) throw new Error("Wallet not connected");

      setPayingGroupId(groupId);
      try {
        await savings.contribute(groupId);
        await fetchPayments();
      } finally {
        setPayingGroupId(null);
      }
    },
    [isConnected, publicKey, savings, fetchPayments],
  );

  useEffect(() => {
    fetchPayments();
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
