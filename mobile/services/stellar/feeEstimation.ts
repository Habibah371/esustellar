import config from '../../config/env';

export const STROOPS_PER_XLM = 10_000_000;

export interface StellarFeeStats {
  lastLedger: number;
  ledgerCapacityUsage: number;
  baseFeeStroops: number;
  baseFeeXLM: number;
  recommendedFeeStroops: number;
  recommendedFeeXLM: number;
  maxFeeStroops: number;
  maxFeeXLM: number;
}

export interface FeeEstimate {
  operations: number;
  feeStroops: number;
  feeXLM: number;
  perOperationStroops: number;
  perOperationXLM: number;
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
}

export function stroopsToXLM(stroops: number): number {
  return Number((stroops / STROOPS_PER_XLM).toFixed(7));
}

export function xlmToStroops(xlm: number): number {
  return Math.round(xlm * STROOPS_PER_XLM);
}

export async function fetchStellarFeeStats(): Promise<StellarFeeStats> {
  const response = await fetch(`${config.stellarHorizonUrl.replace(/\/+$/, '')}/fee_stats`);
  if (!response.ok) {
    throw new Error('[stellar/feeEstimation] Failed to fetch fee stats from Horizon');
  }

  const data = await response.json();
  const lastLedger = parseNumber(data.last_ledger, 0);
  const ledgerCapacityUsage = parseNumber(data.ledger_capacity_usage, 0);

  const baseFeeStroops = parseNumber(data.last_ledger_base_fee, 100);
  const recommendedFeeStroops =
    parseNumber(data.fee_charged?.p10, 0) ||
    parseNumber(data.fee_charged?.mode, 0) ||
    baseFeeStroops;
  const maxFeeStroops =
    parseNumber(data.max_fee?.p90, 0) ||
    parseNumber(data.max_fee?.mode, 0) ||
    baseFeeStroops;

  return {
    lastLedger,
    ledgerCapacityUsage,
    baseFeeStroops,
    baseFeeXLM: stroopsToXLM(baseFeeStroops),
    recommendedFeeStroops,
    recommendedFeeXLM: stroopsToXLM(recommendedFeeStroops),
    maxFeeStroops,
    maxFeeXLM: stroopsToXLM(maxFeeStroops),
  };
}

export async function estimateStellarFee(
  operations = 1,
  useRecommendedFee = true,
): Promise<FeeEstimate> {
  const stats = await fetchStellarFeeStats();
  const perOperationStroops = useRecommendedFee
    ? Math.max(stats.baseFeeStroops, stats.recommendedFeeStroops)
    : stats.baseFeeStroops;
  const feeStroops = Math.max(100, perOperationStroops * Math.max(1, operations));

  return {
    operations,
    feeStroops,
    feeXLM: stroopsToXLM(feeStroops),
    perOperationStroops,
    perOperationXLM: stroopsToXLM(perOperationStroops),
  };
}
