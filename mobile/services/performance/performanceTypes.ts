export type MetricTag = Record<string, string | number | boolean>;

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'percent' | 'bytes';
  timestamp: string;
  tags?: MetricTag;
}

export interface MetricReport {
  metrics: PerformanceMetric[];
  periodStart: string;
  periodEnd: string;
  totalCount: number;
}

export type MetricListener = (metric: PerformanceMetric) => void;
