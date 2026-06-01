import React, { useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { useUserNotifications } from '../../hooks/useNotifications';
import { useRefresh } from '../../hooks/useRefresh';
import { NotificationItem } from '../../components/NotificationItem';
import { EmptyState } from '../../components/ui';
import { Notification } from '../../types/notification';

const sortNotifications = (items: Notification[]) =>
  [...items].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

export default function NotificationInboxScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const wallet = useAuthStore((state) => state.wallet);
  const notifications = useNotificationsStore((state) => state.notifications);
  const setNotifications = useNotificationsStore((state) => state.setNotifications);

  const userAddress = wallet?.publicKey ?? '';
  const { data, refetch } = useUserNotifications(userAddress);

  useEffect(() => {
    if (data?.success) {
      setNotifications(data.data);
    }
  }, [data, setNotifications]);

  const fetchNotifications = useCallback(async () => {
    if (!userAddress) {
      return;
    }

    await refetch();
  }, [refetch, userAddress]);

  const { refreshing, onRefresh } = useRefresh(fetchNotifications);

  const sortedNotifications = useMemo(
    () => sortNotifications(notifications),
    [notifications],
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => <NotificationItem item={item} />,
    [],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <FlatList
        data={sortedNotifications}
        keyExtractor={(item: Notification) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          sortedNotifications.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('notifications.title')}</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}> 
              {t('notifications.subtitle')}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            illustration="notifications"
            title={t('notifications.title')}
            message={t('notifications.subtitle')}
            tone="light"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  listContainer: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
