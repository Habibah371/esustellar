/**
 * InteractionManager Utilities
 *
 * Wraps React Native's InteractionManager so that non-critical work
 * (analytics writes, cache pre-population, log flushes, etc.) is deferred
 * until after all active gestures and animations have completed.
 *
 * Using this prevents JS-thread jank during transitions on both Android and iOS.
 *
 * Usage:
 *   import { runAfterInteractions, deferredPromise } from '@/services/performance/interactionManager';
 *
 *   // Fire-and-forget
 *   runAfterInteractions(() => { recordAnalyticsEvent(...); });
 *
 *   // Awaitable
 *   await deferredPromise(() => expensiveSetup());
 */

import { InteractionManager as RNInteractionManager } from 'react-native';
import { logger } from '../logger';

// The tsconfig targets ES2015+DOM which can miss some React Native globals.
// We cast through unknown to get the type we need without modifying tsconfig.
const InteractionManager = RNInteractionManager as typeof RNInteractionManager;

/**
 * Schedule a callback to run after all current interactions (gestures,
 * animated transitions) have settled.  Returns a cancellation handle.
 *
 * @param callback  Work to defer.
 * @param label     Optional label used for debug logging.
 */
export function runAfterInteractions(
  callback: () => void,
  label = 'deferred-work',
): ReturnType<typeof InteractionManager.runAfterInteractions> {
  const handle = InteractionManager.runAfterInteractions(() => {
    try {
      callback();
    } catch (err) {
      logger.warn(`[interactionManager] "${label}" threw an error`, { err });
    }
  });

  return handle;
}

/**
 * Async version of `runAfterInteractions`.
 * Resolves with the return value of `asyncCallback` once interactions settle.
 *
 * @param asyncCallback  Async work to defer.
 * @param label          Optional label for debug logging.
 */
export function deferredPromise<T>(
  asyncCallback: () => Promise<T>,
  label = 'deferred-async-work',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    InteractionManager.runAfterInteractions(() => {
      asyncCallback().then(resolve).catch((err) => {
        logger.warn(`[interactionManager] "${label}" rejected`, { err });
        reject(err as Error);
      });
    });
  });
}

/**
 * Creates an interaction "handle" that blocks the InteractionManager queue
 * until you call `.done()`.  Use this to wrap custom animations or async
 * work that should itself be treated as an interaction.
 *
 * @example
 *   const handle = createInteractionHandle();
 *   runMyAnimation({ onComplete: () => handle.done() });
 */
export function createInteractionHandle(): { done: () => void } {
  const handle = InteractionManager.createInteractionHandle();
  return {
    done: () => InteractionManager.clearInteractionHandle(handle),
  };
}
