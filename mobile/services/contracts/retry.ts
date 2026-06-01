/**
 * Contract Interaction Retry Logic
 * Provides exponential backoff for gracefully handling failed blockchain transactions.
 */

import { logger } from '../../utils/logger';

// ── Error types ─────────────────────────────────────────────────────────────

export class TransientError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'TransientError';
  }
}

export class PermanentError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'PermanentError';
  }
}

// ── Retry configuration ─────────────────────────────────────────────────────

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelayMs: number;
  /** Jitter factor (0-1) to add randomness (default: 0.1) */
  jitterFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.1,
};

// ── Retry state tracking ────────────────────────────────────────────────────

interface RetryState {
  attempt: number;
  submitted: boolean;
  lastDelay: number;
}

const pendingRetries = new Map<string, RetryState>();

// ── Retry result ────────────────────────────────────────────────────────────

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Calculate exponential backoff delay with jitter.
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const baseBackoff = config.baseDelayMs * Math.pow(2, attempt - 1);
  const cappedBackoff = Math.min(baseBackoff, config.maxDelayMs);
  const jitter = cappedBackoff * config.jitterFactor * Math.random();
  return Math.round(cappedBackoff + jitter);
}

/**
 * Determine if an error is transient (retryable) or permanent.
 */
export function classifyError(error: unknown): TransientError | PermanentError {
  if (error instanceof TransientError || error instanceof PermanentError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  // Transient (retryable) conditions
  const transientPatterns = [
    'timeout',
    'timed out',
    'network error',
    'connection refused',
    'connection reset',
    'too many requests',
    'rate limit',
    'server error',
    'internal server error',
    'service unavailable',
    'bad gateway',
    'gateway timeout',
    'ledger not found',
    'txn_bad_seq',
    'insufficient fee',
    'fee_changed_invalid',
  ];

  if (transientPatterns.some((p) => lower.includes(p))) {
    return new TransientError(message, error);
  }

  // Everything else is considered permanent
  return new PermanentError(message, error);
}

/**
 * Check if a duplicate submission is already in progress for a given key.
 */
export function isDuplicateSubmission(key: string): boolean {
  const state = pendingRetries.get(key);
  return state?.submitted ?? false;
}

/**
 * Mark a submission as in-progress to prevent duplicates.
 */
function markSubmitted(key: string, config: RetryConfig): void {
  pendingRetries.set(key, {
    attempt: 0,
    submitted: true,
    lastDelay: 0,
  });
}

/**
 * Clear submission tracking for a given key.
 */
function clearSubmission(key: string): void {
  pendingRetries.delete(key);
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main retry executor ─────────────────────────────────────────────────────

/**
 * Execute an async operation with exponential backoff retry logic.
 *
 * Distinguishes between transient errors (retryable) and permanent errors
 * (non-retryable). Surfaces the final error to the caller when all retries
 * are exhausted. Prevents duplicate submissions using a deduplication key.
 *
 * @param operation - The async operation to execute and potentially retry.
 * @param dedupKey  - A unique key to prevent duplicate submissions.
 * @param config    - Optional retry configuration overrides.
 *
 * @example
 * const result = await withRetry(
 *   () => sorobanClient.submitTransaction(tx),
 *   `tx_${txHash}`,
 * );
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  dedupKey: string,
  config: Partial<RetryConfig> = {},
): Promise<RetryResult<T>> {
  const mergedConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  // Prevent duplicate submissions
  if (isDuplicateSubmission(dedupKey)) {
    logger.warn('[retry] Duplicate submission prevented', { dedupKey });
    return {
      success: false,
      error: 'A submission for this operation is already in progress.',
      attempts: 0,
    };
  }

  markSubmitted(dedupKey, mergedConfig);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      logger.info('[retry] Executing operation', {
        dedupKey,
        attempt,
        maxRetries: mergedConfig.maxRetries,
      });

      const result = await operation();

      logger.info('[retry] Operation succeeded', { dedupKey, attempt });
      clearSubmission(dedupKey);

      return {
        success: true,
        data: result,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const classified = classifyError(error);

      logger.warn('[retry] Operation failed', {
        dedupKey,
        attempt,
        errorType: classified.name,
        errorMessage: classified.message,
      });

      // If it's a permanent error, do not retry
      if (classified instanceof PermanentError) {
        logger.error('[retry] Permanent failure, not retrying', {
          dedupKey,
          errorMessage: classified.message,
        });
        clearSubmission(dedupKey);
        return {
          success: false,
          error: classified.message,
          attempts: attempt,
        };
      }

      // If this was the last attempt, surface the error
      if (attempt === mergedConfig.maxRetries) {
        logger.error('[retry] All retry attempts exhausted', {
          dedupKey,
          attempts: attempt,
          lastError: classified.message,
        });
        clearSubmission(dedupKey);
        return {
          success: false,
          error: `Operation failed after ${attempt} attempts: ${classified.message}`,
          attempts: attempt,
        };
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt, mergedConfig);
      logger.info('[retry] Waiting before retry', {
        dedupKey,
        attempt,
        nextAttempt: attempt + 1,
        delayMs: delay,
      });

      await sleep(delay);
    }
  }

  // Should not reach here, but just in case
  clearSubmission(dedupKey);
  return {
    success: false,
    error: lastError?.message ?? 'Unknown error occurred',
    attempts: mergedConfig.maxRetries,
  };
}

/**
 * Clear all pending retry states (useful for cleanup / testing).
 */
export function clearAllPendingRetries(): void {
  pendingRetries.clear();
}
