/**
 * Hermes Engine Runtime Verification (#286)
 *
 * Confirms that Hermes is the active JS engine at runtime.
 * `global.HermesInternal` is only defined when Hermes is active.
 */

declare global {
  // eslint-disable-next-line no-var
  var HermesInternal: Record<string, unknown> | undefined;
}

/**
 * Returns true if the app is running on the Hermes JS engine.
 */
export function isHermesEnabled(): boolean {
  return typeof global.HermesInternal !== 'undefined' && global.HermesInternal != null;
}

/**
 * Returns a human-readable label for the active JS engine.
 */
export function getJSEngine(): string {
  return isHermesEnabled() ? 'Hermes' : 'JavaScriptCore';
}
