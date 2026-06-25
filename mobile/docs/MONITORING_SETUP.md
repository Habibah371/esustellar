# Post-Launch Monitoring Setup

## Overview

This document describes how to set up dashboards, alerts, and metric viewing for the Esustellar mobile app post-launch. The `monitoringService.ts` tracks screen load times, API response times, and error rates using a console-based reporting mechanism suitable for early-stage monitoring.

---

## Metric Types

| Metric | Unit | Description |
|--------|------|-------------|
| `screen_load` | ms | Time from navigation start to screen fully rendered |
| `api_response` | ms | Round-trip time for API calls to Stellar endpoints |
| `error_count` | count | Number of errors grouped by type |

---

## Dashboard Setup

### 1. Console Logs (Immediate)

Metrics are flushed every 30 seconds to the console. View them via:

```bash
# iOS
npx expo start --ios
# Then open Metro bundler console

# Android
npx expo start --android
# Check logcat
adb logcat | grep "Performance Metric Report"
```

### 2. Custom Dashboard (Recommended)

Connect a logging service like Sentry, Datadog, or Grafana:

```ts
import { onMetric } from '@/services/performance/monitoringService';

// Forward all metrics to your observability provider
onMetric((metric) => {
  sendToDatadog(metric); // or Sentry, Grafana, etc.
});
```

### 3. Suggested Dashboard Panels

- **Screen Load Times** — P50/P95/P99 histogram by screen name
- **API Latency** — P50/P95/P99 by endpoint
- **Error Rate** — Error count per minute, grouped by error type
- **Active Users** — Unique device IDs reporting metrics per hour

---

## Alert Thresholds

| Alert | Threshold | Window | Severity |
|-------|-----------|--------|----------|
| High screen load time | P95 > 3000ms | 5 min | Warning |
| Critical screen load time | P95 > 5000ms | 5 min | Critical |
| High API latency | P95 > 2000ms | 5 min | Warning |
| Critical API latency | P95 > 5000ms | 5 min | Critical |
| Elevated error rate | > 5% of requests | 5 min | Warning |
| Crash spike | > 1% error rate | 5 min | Critical |
| API timeout rate | > 2% of calls | 5 min | Critical |

### Recommended Alert Channels

- PagerDuty / Opsgenie for Critical alerts
- Slack #monitoring channel for Warning alerts
- Email digest for Info-level metrics

---

## How to View Metrics

### Via Console

All metrics are logged with the `[monitoring]` prefix. Use grep to filter:

```bash
# All performance metric reports
adb logcat | grep "\[monitoring\]"

# Just screen loads
adb logcat | grep "screen_load"

# Just API responses
adb logcat | grep "api_response"
```

### Via Code

```ts
import { getBufferedMetrics, onMetric } from '@/services/performance/monitoringService';

// Get current buffer
const metrics = getBufferedMetrics();

// Subscribe to new metrics
const unsubscribe = onMetric((metric) => {
  console.log('New metric:', metric);
});
```

---

## Integration Steps

1. Call `startMonitoring()` in app entry point (e.g., `app/_layout.tsx`):
   ```ts
   import { startMonitoring } from '@/services/performance/monitoringService';
   startMonitoring();
   ```
2. Wrap navigation events with `trackScreenLoad()`:
   ```ts
   trackScreenLoad('DashboardScreen', durationMs);
   ```
3. Wrap API calls with `trackApiResponse()`:
   ```ts
   trackApiResponse('/transactions', elapsedMs, response.status);
   ```
4. Wrap error handlers with `trackError()`:
   ```ts
   trackError('APIError', error.message);
   ```
5. Connect to external dashboard provider via `onMetric()`.

---

## Future Improvements

- [ ] Switch from console-based to network-based reporting (Sentry, Datadog)
- [ ] Add metric sampling for high-volume events
- [ ] Implement offline metric buffering with retry
- [ ] Add user session correlation to metrics
- [ ] Set up automated Grafana dashboards
