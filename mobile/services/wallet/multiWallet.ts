/**
 * multiWallet.ts
 * Manages multiple Stellar wallets: storage, CRUD, and active-wallet selection.
 * Persists to AsyncStorage so the selected wallet survives app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletEntry {
  id: string;
  label: string;
  publicKey: string;
  createdAt: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
const WALLETS_KEY = 'multiWallet:list';
const ACTIVE_KEY = 'multiWallet:activeId';
const SECRET_KEY_PREFIX = 'multiWallet:secret:';

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function readWallets(): Promise<WalletEntry[]> {
  const raw = await AsyncStorage.getItem(WALLETS_KEY);
  return raw ? (JSON.parse(raw) as WalletEntry[]) : [];
}

async function writeWallets(wallets: WalletEntry[]): Promise<void> {
  await AsyncStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
}

function getSecretStorageKey(id: string): string {
  return `${SECRET_KEY_PREFIX}${id}`;
}

async function readEncryptedSecret(id: string): Promise<string | null> {
  return await SecureStore.getItemAsync(getSecretStorageKey(id));
}

async function writeEncryptedSecret(id: string, encryptedSecret: string): Promise<void> {
  if (!encryptedSecret) {
    return;
  }
  await SecureStore.setItemAsync(getSecretStorageKey(id), encryptedSecret);
}

async function removeEncryptedSecret(id: string): Promise<void> {
  await SecureStore.deleteItemAsync(getSecretStorageKey(id));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Return all stored wallets, ordered by creation date ascending. */
export async function getAllWallets(): Promise<WalletEntry[]> {
  return readWallets();
}

/** Return the currently active wallet, or null if none stored. */
export async function getActiveWallet(): Promise<WalletEntry | null> {
  const [wallets, activeId] = await Promise.all([
    readWallets(),
    AsyncStorage.getItem(ACTIVE_KEY),
  ]);

  if (!activeId) {
    return null;
  }

  return wallets.find((w) => w.id === activeId) ?? null;
}

export async function getWalletSecret(id: string): Promise<string | null> {
  return readEncryptedSecret(id);
}

/**
 * Add a new wallet. Automatically makes it active if it's the first one.
 * @returns the newly created WalletEntry
 */
export async function addWallet(
  label: string,
  publicKey: string,
  encryptedSecret?: string,
): Promise<WalletEntry> {
  const wallets = await readWallets();

  const newWallet: WalletEntry = {
    id: `wallet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label,
    publicKey,
    createdAt: new Date().toISOString(),
  };

  wallets.push(newWallet);
  await writeWallets(wallets);

  if (wallets.length === 1) {
    await AsyncStorage.setItem(ACTIVE_KEY, newWallet.id);
  }

  if (encryptedSecret) {
    await writeEncryptedSecret(newWallet.id, encryptedSecret);
  }

  return newWallet;
}

/** Switch the active wallet instantly. Throws if id not found. */
export async function setActiveWallet(id: string): Promise<void> {
  const wallets = await readWallets();
  if (!wallets.find((w) => w.id === id)) {
    throw new Error(`Wallet ${id} not found`);
  }
  await AsyncStorage.setItem(ACTIVE_KEY, id);
}

export async function clearActiveWallet(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_KEY);
}

/** Update a wallet's label. */
export async function renameWallet(id: string, newLabel: string): Promise<void> {
  const wallets = await readWallets();
  const idx = wallets.findIndex((w) => w.id === id);
  if (idx === -1) throw new Error(`Wallet ${id} not found`);
  wallets[idx].label = newLabel;
  await writeWallets(wallets);
}

/**
 * Remove a wallet. If it was active, the next wallet in the list becomes active
 * (or active is cleared if no wallets remain).
 */
export async function removeWallet(id: string): Promise<void> {
  let wallets = await readWallets();
  const activeId = await AsyncStorage.getItem(ACTIVE_KEY);

  const nextWallets = wallets.filter((w) => w.id !== id);
  await writeWallets(nextWallets);
  await removeEncryptedSecret(id);

  if (activeId === id) {
    if (nextWallets.length > 0) {
      await AsyncStorage.setItem(ACTIVE_KEY, nextWallets[0].id);
    } else {
      await AsyncStorage.removeItem(ACTIVE_KEY);
    }
  }
}