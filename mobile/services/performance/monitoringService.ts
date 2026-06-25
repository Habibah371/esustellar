import { logger } from '../logger';
import type { PerformanceMetric, MetricTag, MetricListener } from './performanceTypes';

const metricsBuffer: PerformanceMetric[] = [];
const listeners: Set<MetricListener> = new Set();
const FLUSH_INTERVAL_MS = 30000;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let isStarted = false;

function nowISO(): string {
  return new Date().toISOString();
}

function reportViaConsole(metrics: PerformanceMetric[]): void {
  console.log('=== Performance Metric Report ===');
  console.log(JSON.stringify({ timestamp: nowISO(), count: metrics.length, metrics }, null, 2));
  console.log('================================');
}

function flush(): void {
  if (metricsBuffer.length === 0) return;

  const batch = metricsBuffer.splice(0, metricsBuffer.length);
  reportViaConsole(batch);

  for (const metric of batch) {
    for (const listener of listeners) {
      try {
        listener(metric);
      } catch (err) {
        logger.warn('[monitoring] listener threw', { err });
      }
    }
  }
}

export function startMonitoring(intervalMs: number = FLUSH_INTERVAL_MS): void {
  if (isStarted) {
    logger.warn('[monitoring] already started');
    return;
  }

  isStarted = true;
  logger.info('[monitoring] started', { intervalMs });

  flushTimer = setInterval(() => {
    flush();
  }, intervalMs);
}

export function stopMonitoring(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  isStarted = false;
  flush();
  logger.info('[monitoring] stopped');
}

export function trackMetric(
  name: string,
  value: number,
  unit: PerformanceMetric['unit'] = 'ms',
  tags?: MetricTag,
): void {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: nowISO(),
    tags,
  };

  metricsBuffer.push(metric);
  logger.debug('[monitoring] metric recorded', { name, value, unit });
}

export function trackScreenLoad(screenName: string, durationMs: number): void {
  trackMetric('screen_load', durationMs, 'ms', { screen: screenName });
}

export function trackApiResponse(endpoint: string, durationMs: number, statusCode: number): void {
  trackMetric('api_response', durationMs, 'ms', { endpoint, statusCode: String(statusCode) });
}

export function trackError(errorType: string, message: string): void {
  trackMetric('error_count', 1, 'count', { errorType, message });
}

export function onMetric(listener: MetricListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBufferedMetrics(): PerformanceMetric[] {
  return [...metricsBuffer];
}
