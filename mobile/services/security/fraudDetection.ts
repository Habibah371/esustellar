/**
 * Fraud Detection Signals (UX Layer)
 *
 * Warns users of unusual contribution patterns or suspicious activity
 * within the mobile application. Provides sensitivity settings to
 * control alert thresholds.
 */

import { useCallback, useMemo, useState } from 'react';
import { logger } from '../../utils/logger';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ContributionRecord {
  amount: number;
  timestamp: number;
  source: string;
  /** Optional group or context identifier */
  groupId?: string;
}

export enum FraudSensitivity {
  /** Only flag extreme anomalies (legacy behavior) */
  LOW = 'low',
  /** Recommended default — balance between false positives and coverage */
  MEDIUM = 'medium',
  /** Maximum vigilance — may produce more alerts */
  HIGH = 'high',
}

export interface FraudDetectionResult {
  hasAlert: boolean;
  alerts: FraudAlert[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface FraudAlert {
  id: string;
  type: FraudSignalType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: string;
  timestamp: number;
}

export enum FraudSignalType {
  RAPID_CONTRIBUTIONS = 'rapid_contributions',
  UNUSUAL_AMOUNT = 'unusual_amount',
  HIGH_FREQUENCY = 'high_frequency',
  UNKNOWN_SOURCE = 'unknown_source',
  DUPLICATE_PATTERN = 'duplicate_pattern',
}

// ─── Sensitivity thresholds ─────────────────────────────────────────────────

interface SensitivityThresholds {
  /** Max contributions within a time window before alerting */
  rapidContributionLimit: number;
  /** Time window in ms for rapid contribution detection */
  rapidContributionWindowMs: number;
  /** Amount considered "unusually large" as a multiplier of the median */
  largeAmountMultiplier: number;
  /** Max contributions from a single source in the window */
  maxPerSource: number;
  /** Time window in ms for source frequency checks */
  sourceWindowMs: number;
}

const SENSITIVITY_THRESHOLDS: Record<FraudSensitivity, SensitivityThresholds> = {
  [FraudSensitivity.LOW]: {
    rapidContributionLimit: 5,
    rapidContributionWindowMs: 120_000, // 2 minutes
    largeAmountMultiplier: 10,
    maxPerSource: 5,
    sourceWindowMs: 60_000, // 1 minute
  },
  [FraudSensitivity.MEDIUM]: {
    rapidContributionLimit: 3,
    rapidContributionWindowMs: 60_000, // 1 minute
    largeAmountMultiplier: 5,
    maxPerSource: 3,
    sourceWindowMs: 300_000, // 5 minutes
  },
  [FraudSensitivity.HIGH]: {
    rapidContributionLimit: 2,
    rapidContributionWindowMs: 30_000, // 30 seconds
    largeAmountMultiplier: 3,
    maxPerSource: 2,
    sourceWindowMs: 600_000, // 10 minutes
  },
};

// ─── Utilities ──────────────────────────────────────────────────────────────

let alertCounter = 0;

function generateAlertId(): string {
  return `fraud_${Date.now()}_${++alertCounter}`;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// ─── Detection engine ───────────────────────────────────────────────────────

/**
 * Analyze contribution records for suspicious patterns and return alerts.
 *
 * @param records  - Array of recent contribution records to analyze.
 * @param sensitivity - Alert sensitivity level (default: MEDIUM).
 * @param history - Optional larger history of contributions for amount baseline.
 */
export function analyzeContributions(
  records: ContributionRecord[],
  sensitivity: FraudSensitivity = FraudSensitivity.MEDIUM,
  history?: ContributionRecord[],
): FraudDetectionResult {
  const alerts: FraudAlert[] = [];
  const thresholds = SENSITIVITY_THRESHOLDS[sensitivity];
  const now = Date.now();

  if (records.length < 2) {
    return { hasAlert: false, alerts: [], riskLevel: 'low' };
  }

  // Sort by timestamp descending (most recent first)
  const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp);

  // ── 1. Rapid contributions detection ─────────────────────────────

  const recentWindow = sorted.filter(
    (r) => now - r.timestamp < thresholds.rapidContributionWindowMs,
  );

  if (recentWindow.length >= thresholds.rapidContributionLimit) {
    alerts.push({
      id: generateAlertId(),
      type: FraudSignalType.RAPID_CONTRIBUTIONS,
      severity: recentWindow.length >= thresholds.rapidContributionLimit * 2
        ? 'critical'
        : 'warning',
      message:
        recentWindow.length >= thresholds.rapidContributionLimit * 2
          ? 'Unusually high volume of recent contributions detected.'
          : 'Multiple rapid contributions detected.',
      details: `${recentWindow.length} contributions in the last ${thresholds.rapidContributionWindowMs / 1000}s.`,
      timestamp: now,
    });
  }

  // ── 2. Unusual amount detection ──────────────────────────────────

  const allAmounts = (history ?? records).map((r) => r.amount);
  const medianAmount = calculateMedian(allAmounts);
  const thresholdAmount = medianAmount * thresholds.largeAmountMultiplier;

  const largeContributions = sorted.filter(
    (r) => r.amount > thresholdAmount && thresholdAmount > 0,
  );

  if (largeContributions.length > 0) {
    alerts.push({
      id: generateAlertId(),
      type: FraudSignalType.UNUSUAL_AMOUNT,
      severity: 'warning',
      message: `Unusually large contribution${largeContributions.length > 1 ? 's' : ''} detected.`,
      details: `Amount${largeContributions.length > 1 ? 's range from ' : ': '}${largeContributions.map((r) => r.amount).join(', ')} XLM (threshold: ${thresholdAmount.toFixed(2)} XLM).`,
      timestamp: now,
    });
  }

  // ── 3. Single source frequency detection ─────────────────────────

  const sourceWindow = sorted.filter(
    (r) => now - r.timestamp < thresholds.sourceWindowMs,
  );

  const sourceCounts = new Map<string, number>();
  for (const record of sourceWindow) {
    sourceCounts.set(record.source, (sourceCounts.get(record.source) ?? 0) + 1);
  }

  for (const [source, count] of sourceCounts) {
    if (count > thresholds.maxPerSource) {
      alerts.push({
        id: generateAlertId(),
        type: FraudSignalType.HIGH_FREQUENCY,
        severity: count > thresholds.maxPerSource * 2 ? 'critical' : 'warning',
        message: `High contribution frequency from a single source.`,
        details: `Source: ${source.slice(0, 8)}... — ${count} contributions in the last ${thresholds.sourceWindowMs / 1000}s.`,
        timestamp: now,
      });
    }
  }

  // ── 4. Duplicate pattern detection ───────────────────────────────

  const amountFrequency = new Map<number, number>();
  for (const record of recentWindow) {
    amountFrequency.set(record.amount, (amountFrequency.get(record.amount) ?? 0) + 1);
  }

  for (const [amount, count] of amountFrequency) {
    if (count >= 3 && amount > 0) {
      alerts.push({
        id: generateAlertId(),
        type: FraudSignalType.DUPLICATE_PATTERN,
        severity: 'info',
        message: `Repeated contributions of ${amount} XLM detected.`,
        details: `${count} identical contributions found. Verify this is intentional.`,
        timestamp: now,
      });
      break; // Only one duplicate alert per analysis
    }
  }

  // ── Risk level calculation ───────────────────────────────────────

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  let riskLevel: 'low' | 'medium' | 'high';
  if (criticalCount > 0) {
    riskLevel = 'high';
  } else if (warningCount > 0) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Log activity for backend review
  if (alerts.length > 0) {
    logger.warn('[fraudDetection] Suspicious activity detected', {
      alertCount: alerts.length,
      riskLevel,
      sensitivity,
      recordsAnalyzed: records.length,
      alerts: alerts.map((a) => ({ type: a.type, severity: a.severity, message: a.message })),
    });
  }

  return {
    hasAlert: alerts.length > 0,
    alerts,
    riskLevel,
  };
}

// ── React hook for fraud detection ──────────────────────────────────────────

interface UseFraudDetectionOptions {
  /** User's preferred sensitivity level */
  sensitivity?: FraudSensitivity;
  /** Optional larger historical data for amount baselines */
  history?: ContributionRecord[];
}

interface UseFraudDetectionReturn {
  /** Current alerts from the latest analysis */
  alerts: FraudAlert[];
  /** Overall risk level */
  riskLevel: 'low' | 'medium' | 'high';
  /** Whether there are active alerts */
  hasAlert: boolean;
  /** Analyze a set of records and update alerts */
  analyze: (records: ContributionRecord[]) => void;
  /** Dismiss a specific alert by ID */
  dismissAlert: (alertId: string) => void;
  /** Clear all alerts */
  clearAlerts: () => void;
  /** Current sensitivity level */
  sensitivity: FraudSensitivity;
  /** Update sensitivity level */
  setSensitivity: (level: FraudSensitivity) => void;
}

/**
 * React hook that provides fraud detection analysis and state management.
 *
 * @example
 * const { alerts, hasAlert, analyze, sensitivity, setSensitivity } = useFraudDetection();
 *
 * // Analyze contributions when they arrive
 * useEffect(() => {
 *   if (contributions.length > 0) {
 *     analyze(contributions);
 *   }
 * }, [contributions]);
 */
export function useFraudDetection(
  options: UseFraudDetectionOptions = {},
): UseFraudDetectionReturn {
  const [sensitivity, setSensitivity] = useState<FraudSensitivity>(
    options.sensitivity ?? FraudSensitivity.MEDIUM,
  );
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);

  const analyze = useCallback(
    (records: ContributionRecord[]) => {
      const result = analyzeContributions(records, sensitivity, options.history);
      setAlerts(result.alerts);
    },
    [sensitivity, options.history],
  );

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const riskLevel = useMemo(() => {
    const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
    const warningCount = alerts.filter((a) => a.severity === 'warning').length;
    if (criticalCount > 0) return 'high';
    if (warningCount > 0) return 'medium';
    return 'low';
  }, [alerts]);

  return {
    alerts,
    riskLevel,
    hasAlert: alerts.length > 0,
    analyze,
    dismissAlert,
    clearAlerts,
    sensitivity,
    setSensitivity,
  };
}

// ── Sensitivity labels for UI display ───────────────────────────────────────

export const FRAUD_SENSITIVITY_OPTIONS: {
  value: FraudSensitivity;
  label: string;
  description: string;
}[] = [
  {
    value: FraudSensitivity.LOW,
    label: 'Low',
    description: 'Only flag extreme anomalies — fewer alerts.',
  },
  {
    value: FraudSensitivity.MEDIUM,
    label: 'Medium',
    description: 'Balanced detection — recommended default.',
  },
  {
    value: FraudSensitivity.HIGH,
    label: 'High',
    description: 'Maximum vigilance — may produce more alerts.',
  },
];

/**
 * Map a sensitivity level to a human-readable display label.
 */
export function getSensitivityLabel(sensitivity: FraudSensitivity): string {
  return FRAUD_SENSITIVITY_OPTIONS.find((o) => o.value === sensitivity)?.label ?? 'Medium';
}
