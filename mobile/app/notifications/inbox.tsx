import React, { useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { useUserNotifications, useMarkAllNotificationsRead } from '../../hooks/useNotifications';
import { useRefresh } from '../../hooks/useRefresh';
import { NotificationItem } from '../../components/NotificationItem';
import { NotificationCategoryFilter } from '../../components/notifications/NotificationCategoryFilter';
import { EmptyState } from '../../components/ui';
import { Notification, NotificationCategory } from '../../types/notification';

const sortNotifications = (items: Notification[]) =>
  [...items].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

export default function NotificationInboxScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const wallet = useAuthStore((state) => state.wallet);
  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const selectedCategory = useNotificationsStore((state) => state.selectedCategory);
  const setNotifications = useNotificationsStore((state) => state.setNotifications);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const setSelectedCategory = useNotificationsStore((state) => state.setSelectedCategory);
  const getFilteredNotifications = useNotificationsStore((state) => state.getFilteredNotifications);

  const userAddress = wallet?.publicKey ?? '';
  const { data, refetch } = useUserNotifications(userAddress);
  const markAllMutation = useMarkAllNotificationsRead();

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

  const filteredNotifications = useMemo(() => {
    return getFilteredNotifications();
  }, [getFilteredNotifications]);

  const sortedNotifications = useMemo(
    () => sortNotifications(filteredNotifications),
    [filteredNotifications],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    // Optimistic update
    markAllRead();
    // Sync with backend
    await markAllMutation.mutateAsync(userAddress);
  }, [markAllRead, userAddress, markAllMutation]);

  const handleCategoryChange = useCallback(
    (category: NotificationCategory) => {
      setSelectedCategory(category);
    },
    [setSelectedCategory],
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => <NotificationItem item={item} />,
    [],
  );

  const hasUnread = unreadCount > 0;

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
            <View style={styles.headerTop}>
              <Text style={[styles.title, { color: colors.text }]}>{t('notifications.title')}</Text>
              {hasUnread && (
                <Pressable
                  onPress={handleMarkAllAsRead}
                  disabled={markAllMutation.isPending}
                  style={({ pressed }) => [
                    styles.markAllButton,
                    { 
                      backgroundColor: colors.accent,
                      opacity: pressed || markAllMutation.isPending ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={styles.markAllButtonText}>
                    {t('notifications.markAllAsRead')}
                  </Text>
                </Pressable>
              )}
            </View>
            <Text style={[styles.subtitle, { color: colors.subtext }]}> 
              {t('notifications.subtitle')}
            </Text>
            <NotificationCategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  markAllButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
