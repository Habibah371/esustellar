import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTO_LOCK_KEY = 'esustellar_auto_lock_timeout';
export const AUTO_LOCK_OPTIONS = [
  { label: '1 min', value: 60 },
  { label: '5 min', value: 300 },
  { label: '15 min', value: 900 },
  { label: 'Never', value: 0 },
] as const;
export const DEFAULT_TIMEOUT = 300; // 5 minutes

// Global state to track last interaction time
let lastInteractionTimestamp = Date.now();

export function recordInteraction() {
  lastInteractionTimestamp = Date.now();
}

export async function getAutoLockTimeout(): Promise<number> {
  const stored = await AsyncStorage.getItem(AUTO_LOCK_KEY);
  return stored !== null ? parseInt(stored, 10) : DEFAULT_TIMEOUT;
}

export async function setAutoLockTimeout(seconds: number): Promise<void> {
  await AsyncStorage.setItem(AUTO_LOCK_KEY, String(seconds));
}

/**
 * Monitors AppState changes and idle time to trigger `onLock`.
 */
export function useAutoLock(onLock: () => void) {
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    const checkTimeout = async () => {
      const timeout = await getAutoLockTimeout();
      if (timeout === 0) return;

      const now = Date.now();
      const idleTime = (now - lastInteractionTimestamp) / 1000;

      if (idleTime >= timeout) {
        onLock();
      }
    };

    const handleChange = async (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (next === 'active') {
        const timeout = await getAutoLockTimeout();
        if (timeout === 0) return;

        const now = Date.now();
        // Check if we timed out while backgrounded
        if (backgroundedAt.current !== null) {
          const elapsed = (now - backgroundedAt.current) / 1000;
          if (elapsed >= timeout) {
            onLock();
            backgroundedAt.current = null;
            return;
          }
        }

        // Also check if we timed out due to idle time
        const idleTime = (now - lastInteractionTimestamp) / 1000;
        if (idleTime >= timeout) {
          onLock();
        }
        backgroundedAt.current = null;
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    
    // Foreground idle check interval
    const interval = setInterval(checkTimeout, 10000); // Check every 10 seconds

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [onLock]);
}
