import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredMetric = {
  name: string;
  durationMs: number;
  recordedAt: string;
};

const PERFORMANCE_METRICS_KEY = 'esustellar_performance_metrics';

export async function recordPerformanceMetric(metric: StoredMetric): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(PERFORMANCE_METRICS_KEY);
    const metrics = existing ? (JSON.parse(existing) as StoredMetric[]) : [];
    await AsyncStorage.setItem(PERFORMANCE_METRICS_KEY, JSON.stringify([...metrics, metric]));
    console.log(`[performance] ${metric.name}: ${metric.durationMs}ms`);
  } catch (error) {
    console.warn('[performance] failed to store metric', error);
  }
}

export async function logStartupMetric(durationMs: number): Promise<void> {
  await recordPerformanceMetric({
    name: 'app_startup',
    durationMs,
    recordedAt: new Date().toISOString(),
  });
}

export async function getPerformanceMetrics(): Promise<StoredMetric[]> {
  try {
    const stored = await AsyncStorage.getItem(PERFORMANCE_METRICS_KEY);
    return stored ? (JSON.parse(stored) as StoredMetric[]) : [];
  } catch {
    return [];
  }
}

export type {
  PerformanceMetric,
  MetricTag,
  MetricReport,
  MetricListener,
} from './performanceTypes';

export {
  startMonitoring,
  stopMonitoring,
  trackMetric,
  trackScreenLoad,
  trackApiResponse,
  trackError,
  onMetric,
  getBufferedMetrics,
} from './monitoringService';
