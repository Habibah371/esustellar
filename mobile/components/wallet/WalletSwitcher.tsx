/**
 * WalletSwitcher.tsx
 * Displays all stored wallets in a bottom-sheet-style modal.
 * Active wallet is clearly indicated; tapping another switches instantly.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  WalletEntry,
  getAllWallets,
  getActiveWallet,
  removeWallet,
  setActiveWallet,
} from '../../services/wallet/multiWallet';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Truncate a Stellar public key: GABCD…WXYZ */
function truncateKey(key: string): string {
  return `${key.slice(0, 5)}…${key.slice(-4)}`;
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function WalletRow({
  wallet,
  isActive,
  onSelect,
  onRemove,
}: {
  wallet: WalletEntry;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, isActive && styles.rowActive]}
      onPress={() => onSelect(wallet.id)}
      accessibilityLabel={`Select wallet ${wallet.label}`}
      accessibilityState={{ selected: isActive }}
    >
      {/* Colour dot keyed to first char of public key */}
      <View style={[styles.dot, { backgroundColor: keyColor(wallet.publicKey) }]} />

      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]}>
            {wallet.label}
          </Text>
          {isActive && (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowKey}>{truncateKey(wallet.publicKey)}</Text>
      </View>

      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => onRemove(wallet.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={`Remove wallet ${wallet.label}`}
      >
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

/** Deterministic pastel colour from a public key */
function keyColor(key: string): string {
  const palette = ['#93C5FD', '#6EE7B7', '#FCA5A5', '#FCD34D', '#C4B5FD', '#F9A8D4'];
  const idx = key.charCodeAt(1) % palette.length;
  return palette[idx];
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WalletSwitcherProps {
  visible: boolean;
  onClose: () => void;
  /** Called after the active wallet changes so the parent can re-render */
  onWalletChanged?: (wallet: WalletEntry) => void;
  /** Called when the user taps "Add wallet" */
  onAddWallet?: () => void;
}

export default function WalletSwitcher({
  visible,
  onClose,
  onWalletChanged,
  onAddWallet,
}: WalletSwitcherProps) {
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [all, active] = await Promise.all([getAllWallets(), getActiveWallet()]);
    setWallets(all);
    setActiveId(active?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible) void load();
  }, [visible, load]);

  const handleSelect = useCallback(
    async (id: string) => {
      if (id === activeId) return; // already active — no-op
      await setActiveWallet(id);
      setActiveId(id);
      const selected = wallets.find((w) => w.id === id);
      if (selected) onWalletChanged?.(selected);
      onClose();
    },
    [activeId, wallets, onWalletChanged, onClose],
  );

  const handleRemove = useCallback(
    (id: string) => {
      const wallet = wallets.find((w) => w.id === id);
      Alert.alert(
        'Remove wallet',
        `Remove "${wallet?.label ?? 'this wallet'}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              await removeWallet(id);
              void load();
            },
          },
        ],
      );
    },
    [wallets, load],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        <Text style={styles.sheetTitle}>Your wallets</Text>

        {loading ? (
          <ActivityIndicator style={{ marginVertical: 32 }} color="#3B82F6" />
        ) : (
          <FlatList
            data={wallets}
            keyExtractor={(w) => w.id}
            renderItem={({ item }) => (
              <WalletRow
                wallet={item}
                isActive={item.id === activeId}
                onSelect={handleSelect}
                onRemove={handleRemove}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No wallets added yet.</Text>
            }
            scrollEnabled={wallets.length > 5}
          />
        )}

        <TouchableOpacity style={styles.addBtn} onPress={onAddWallet}>
          <Text style={styles.addBtnText}>+ Add wallet</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopStartRadius: 24,
    borderTopEndRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '70%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 16,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  rowActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  dot: {
    width: 10, height: 10, borderRadius: 5, marginEnd: 12,
  },
  rowInfo: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  rowLabelActive: { color: '#1D4ED8' },
  rowKey: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  activePill: {
    backgroundColor: '#DBEAFE', paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 20,
  },
  activePillText: { fontSize: 11, fontWeight: '600', color: '#1D4ED8' },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 14, color: '#94A3B8' },

  emptyText: { textAlign: 'center', color: '#94A3B8', paddingVertical: 24 },

  addBtn: {
    marginTop: 12, backgroundColor: '#F1F5F9',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#3B82F6' },
});