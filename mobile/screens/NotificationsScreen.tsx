import React, { useCallback, useEffect, useMemo } from 'react';
import { View, FlatList } from 'react-native';
import { useNotificationsStore } from '../stores/notificationsStore';
import { NotificationItem } from '../components/NotificationItem';
import { EmptyState } from '../components/ui';
import { Notification } from '../types/notification';

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Welcome',
    message: 'Thanks for joining!',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Update',
    message: 'New feature released',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

export const NotificationsScreen = () => {
  const notifications = useNotificationsStore((state) => state.notifications);
  const setNotifications = useNotificationsStore(
    (state) => state.setNotifications,
  );

  const initialNotifications = useMemo(() => MOCK_NOTIFICATIONS, []);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications, setNotifications]);

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => <NotificationItem item={item} />,
    [],
  );

  return (
    <View>
      <FlatList
        data={notifications}
        keyExtractor={(item: Notification) => item.id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? { flexGrow: 1 } : undefined}
        ListEmptyComponent={
          <EmptyState
            tone="light"
            illustration="notifications"
            title="All caught up"
            message="You have no new notifications."
          />
        }
      />
    </View>
  );
};
