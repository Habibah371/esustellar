/**
 * Background sync scheduler
 *
 * Expo SDK 51 supports background fetch through expo-background-fetch and
 * expo-task-manager. The OS ultimately decides exact run timing, so this file
 * keeps the requested cadence conservative and adds an app-level throttle.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { useAuthStore } from '../../store/authStore';
import { syncService } from './backgroundSync';

export const BACKGROUND_SYNC_TASK_NAME = 'esustellar-background-sync';

const LAST_BACKGROUND_SYNC_KEY = 'esustellar:last-background-sync-at';

export interface BackgroundSyncSchedulerConfig {
  /**
   * Requested minimum interval in seconds. Expo/OS scheduling is advisory.
   * Android enforces practical minimums, and iOS may run less frequently.
   */
  minimumIntervalSeconds: number;
  /**
   * Local throttle to prevent clustered runs from draining battery.
   */
  minimumElapsedBetweenRunsMs: number;
  /**
   * Android only. Keeps the job registered after app termination.
   */
  stopOnTerminate: boolean;
  /**
   * Android only. Re-registers after device boot when the OS allows it.
   */
  startOnBoot: boolean;
}

export const DEFAULT_BACKGROUND_SYNC_SCHEDULER_CONFIG: BackgroundSyncSchedulerConfig = {
  minimumIntervalSeconds: 30 * 60,
  minimumElapsedBetweenRunsMs: 25 * 60 * 1000,
  stopOnTerminate: false,
  startOnBoot: true,
};

let activeConfig = DEFAULT_BACKGROUND_SYNC_SCHEDULER_CONFIG;
let taskRunning = false;

async function getLastBackgroundSyncAt(): Promise<number> {
  const stored = await AsyncStorage.getItem(LAST_BACKGROUND_SYNC_KEY);
  const parsed = stored ? Number(stored) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

async function setLastBackgroundSyncAt(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(LAST_BACKGROUND_SYNC_KEY, String(timestamp));
}

async function runScheduledSync(): Promise<BackgroundFetch.BackgroundFetchResult> {
  if (taskRunning) {
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  const wallet = useAuthStore.getState().wallet;
  if (!wallet?.publicKey) {
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  const now = Date.now();
  const lastSyncAt = await getLastBackgroundSyncAt();
  if (now - lastSyncAt < activeConfig.minimumElapsedBetweenRunsMs) {
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  taskRunning = true;

  try {
    await syncService.sync();
    await setLastBackgroundSyncAt(Date.now());
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[BackgroundSyncScheduler] Background sync failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  } finally {
    taskRunning = false;
  }
}

TaskManager.defineTask(BACKGROUND_SYNC_TASK_NAME, runScheduledSync);

export async function getBackgroundSyncSchedulerStatus() {
  const [status, isRegistered] = await Promise.all([
    BackgroundFetch.getStatusAsync(),
    TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK_NAME),
  ]);

  return { status, isRegistered };
}

export async function registerBackgroundSyncScheduler(
  config: Partial<BackgroundSyncSchedulerConfig> = {},
): Promise<boolean> {
  activeConfig = {
    ...DEFAULT_BACKGROUND_SYNC_SCHEDULER_CONFIG,
    ...config,
  };

  const status = await BackgroundFetch.getStatusAsync();
  if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
    console.warn('[BackgroundSyncScheduler] Background fetch unavailable:', status);
    return false;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK_NAME);
  if (isRegistered) {
    return true;
  }

  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK_NAME, {
    minimumInterval: activeConfig.minimumIntervalSeconds,
    stopOnTerminate: activeConfig.stopOnTerminate,
    startOnBoot: activeConfig.startOnBoot,
  });

  console.log('[BackgroundSyncScheduler] Registered background sync task');
  return true;
}

export async function unregisterBackgroundSyncScheduler(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK_NAME);
  if (!isRegistered) {
    return;
  }

  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK_NAME);
  console.log('[BackgroundSyncScheduler] Unregistered background sync task');
}

export async function runBackgroundSyncNow(): Promise<BackgroundFetch.BackgroundFetchResult> {
  return runScheduledSync();
}
