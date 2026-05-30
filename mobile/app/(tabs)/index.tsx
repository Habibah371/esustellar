import React, { useMemo } from 'react';
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
  const displayName = useMemo(() => wallet ? truncateAddress(wallet.publicKey) : t('home.defaultUser'), [wallet, t]);
  const greeting = useMemo(() => getGreeting(new Date().getHours(), t), [t]);

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
        <Text style={[styles.address, { color: colors.subtext }]}>{displayName}</Text>
      </View>
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
  );
});

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const invalidateGroups = useInvalidateGroups();
  const invalidateTransactions = useInvalidateTransactions();
  const invalidateNotifications = useInvalidateNotifications();

  const fetchData = useMemo(() => async () => {
    logger.info('HomeScreen', 'Refreshing home data');
    await Promise.all([
      invalidateGroups(),
      invalidateTransactions(),
      invalidateNotifications(),
    ]);
  }, [invalidateGroups, invalidateTransactions, invalidateNotifications]);

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
  greeting: { fontSize: 22, fontWeight: '700' },
  address: { fontSize: 13, marginTop: 2 },
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
