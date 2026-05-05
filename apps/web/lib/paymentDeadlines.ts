import type { Frequency } from "@/context/savingsContract";
import { getDaysRemaining } from "@/lib/dashboardStats";

const ROUND_DURATION: Record<Frequency, number> = {
  Weekly: 604_800,
  BiWeekly: 1_209_600,
  Monthly: 2_592_000,
};

export const GRACE_PERIOD = 259_200; // 3 days in seconds

export type UrgencyLevel = "critical" | "urgent" | "soon" | "normal";

export interface PaymentInfo {
  groupName: string;
  groupId: string;
  contractAddress: string;
  amountXLM: number;
  deadline: number; // unix timestamp (seconds)
  daysRemaining: number;
  urgency: UrgencyLevel;
  inGracePeriod: boolean;
  graceDaysRemaining: number;
}

export function calculateDeadline(
  startTimestamp: number,
  currentRound: number,
  frequency: Frequency,
): number {
  return startTimestamp + currentRound * ROUND_DURATION[frequency];
}

export function getUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining < 0) return "critical";
  if (daysRemaining <= 2) return "urgent";
  if (daysRemaining <= 7) return "soon";
  return "normal";
}

const URGENCY_ORDER: Record<UrgencyLevel, number> = {
  critical: 0,
  urgent: 1,
  soon: 2,
  normal: 3,
};

export function buildPaymentInfo(
  groupName: string,
  groupId: string,
  contractAddress: string,
  contributionAmountStroops: bigint,
  startTimestamp: number,
  currentRound: number,
  frequency: Frequency,
): PaymentInfo {
  const deadline = calculateDeadline(startTimestamp, currentRound, frequency);
  const daysRemaining = getDaysRemaining(deadline);
  const urgency = getUrgencyLevel(daysRemaining);

  const nowTs = Math.floor(Date.now() / 1000);
  const graceEnd = deadline + GRACE_PERIOD;
  const inGracePeriod = nowTs > deadline && nowTs < graceEnd;
  const graceDaysRemaining = inGracePeriod
    ? Math.ceil((graceEnd - nowTs) / 86_400)
    : 0;

  return {
    groupName,
    groupId,
    contractAddress,
    amountXLM: Number(contributionAmountStroops) / 10_000_000,
    deadline,
    daysRemaining,
    urgency,
    inGracePeriod,
    graceDaysRemaining,
  };
}

export function sortPayments(payments: PaymentInfo[]): PaymentInfo[] {
  return [...payments].sort((a, b) => {
    const urgencyDiff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    return a.deadline - b.deadline;
  });
}
