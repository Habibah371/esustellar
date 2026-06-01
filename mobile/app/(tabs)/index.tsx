import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useRefresh } from '../../hooks/useRefresh';
import { useInvalidateGroups } from '../../hooks/useGroups';
import { useInvalidateTransactions } from '../../hooks/useTransactions';
import { useInvalidateNotifications } from '../../hooks/useNotifications';
import { triggerHapticFeedback } from '../../utils/haptics';
import { logger } from '../../services/logger';
import WalletSwitcher from '../../components/wallet/WalletSwitcher';
import { getActiveWallet, WalletEntry } from '../../services/wallet/multiWallet';

function getGreeting(hour: number, t: any): string {
  if (hour < 12) return t('home.goodMorning');
  if (hour < 18) return t('home.goodAfternoon');
  return t('home.goodEvening');
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const HomeHeader = React.memo(() => {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const wallet = useAuthStore((s) => s.wallet);
  const setWallet = useAuthStore((s) => s.setWallet);
  const [switcherVisible, setSwitcherVisible] = useState(false);

  const displayName = useMemo(
    () => (wallet ? truncateAddress(wallet.publicKey) : t('home.defaultUser')),
    [wallet, t],
  );
  const greeting = useMemo(
    () => getGreeting(new Date().getHours(), t),
    [t],
  );

  const handleWalletChanged = useCallback(
    (walletEntry: WalletEntry) => {
      setWallet({ publicKey: walletEntry.publicKey, walletType: 'multiWallet' });
    },
    [setWallet],
  );

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.accountInfo}
          accessibilityLabel="Switch wallet"
          accessibilityRole="button"
          onPress={() => setSwitcherVisible(true)}
        >
          <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
          <Text style={[styles.address, { color: colors.subtext }]}>{displayName}</Text>
          <Text style={[styles.switchHint, { color: colors.subtext }]}>Tap to switch wallets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel={t('home.notifications')}
          accessibilityRole="button"
          onPress={() => {
            triggerHapticFeedback.selection();
            router.push('/notifications');
          }}
          style={styles.bell}
        >
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <WalletSwitcher
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
        onWalletChanged={handleWalletChanged}
        onAddWallet={() => router.push('/wallet/add')}
      />
    </>
  );
});

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const wallet = useAuthStore((s) => s.wallet);
  const setWallet = useAuthStore((s) => s.setWallet);

  const invalidateGroups = useInvalidateGroups();
  const invalidateTransactions = useInvalidateTransactions();
  const invalidateNotifications = useInvalidateNotifications();

  useEffect(() => {
    if (wallet) return;

    let active = true;

    void (async () => {
      const activeWallet = await getActiveWallet();
      if (!active || !activeWallet) return;
      setWallet({ publicKey: activeWallet.publicKey, walletType: 'multiWallet' });
    })();

    return () => {
      active = false;
    };
  }, [wallet, setWallet]);

  const fetchData = useMemo(
    () => async () => {
      logger.info('HomeScreen', 'Refreshing home data');
      await Promise.all([
        invalidateGroups(),
        invalidateTransactions(),
        invalidateNotifications(),
      ]);
    },
    [invalidateGroups, invalidateTransactions, invalidateNotifications],
  );

  const { refreshing, onRefresh } = useRefresh(fetchData);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <HomeHeader />
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.subtext }]}>{t('home.totalBalance')}</Text>
        <Text style={[styles.sectionValue, { color: colors.text }]}>{t('home.balanceValue')}</Text>
      </View>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.subtext }]}>{t('home.quickActions')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  accountInfo: {
    flex: 1,
  },
  greeting: { fontSize: 22, fontWeight: '700' },
  address: { fontSize: 13, marginTop: 2 },
  switchHint: { fontSize: 12, marginTop: 4 },
  bell: { padding: 8 },
  bellIcon: { fontSize: 22 },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 13, marginBottom: 4 },
  sectionValue: { fontSize: 24, fontWeight: '700' },
});
