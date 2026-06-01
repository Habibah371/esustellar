/** Notifies the root layout when the user completes PIN/biometric unlock. */
let unlockHandler: (() => void) | null = null;

export function registerAppUnlockHandler(handler: () => void): () => void {
  unlockHandler = handler;
  return () => {
    if (unlockHandler === handler) {
      unlockHandler = null;
    }
  };
}

export function notifyAppUnlocked(): void {
  unlockHandler?.();
}
