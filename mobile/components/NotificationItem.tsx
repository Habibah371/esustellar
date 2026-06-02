import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Notification, NOTIFICATION_CATEGORIES } from '../types/notification';
import { useNotificationsStore } from '../stores/notificationsStore';
import { useMarkNotificationRead } from '../hooks/useNotifications';

dayjs.extend(relativeTime);

type Props = {
  item: Notification;
};

const typeToEmoji: Record<NonNullable<Notification['type']>, string> = {
  contribution: '💰',
  payout: '💸',
  member: '👥',
  status: '📢',
};

const getNotificationCategory = (notification: Notification) => {
  if (!notification.type && !notification.category) return 'updates';
  
  const category = notification.category;
  if (category && category !== 'all') return category;

  switch (notification.type) {
    case 'payout':
      return 'payments';
    case 'contribution':
      return 'payments';
    case 'member':
      return 'members';
    case 'status':
      return 'updates';
    default:
      return 'updates';
  }
};

const arePropsEqual = (prev: Props, next: Props) =>
  prev.item.id === next.item.id &&
  prev.item.title === next.item.title &&
  prev.item.message === next.item.message &&
  prev.item.read === next.item.read &&
  prev.item.createdAt === next.item.createdAt &&
  prev.item.type === next.item.type &&
  prev.item.category === next.item.category;

function NotificationItemComponent({ item }: Props) {
  const markRead = useNotificationsStore((state) => state.markRead);
  const markNotificationReadMutation = useMarkNotificationRead();

  const handlePress = useCallback(async () => {
    if (!item.read) {
      // Optimistic update
      markRead(item.id);
      // Sync with backend
      await markNotificationReadMutation.mutateAsync(item.id);
    }
  }, [item.id, item.read, markRead, markNotificationReadMutation]);

  const relativeDate = useMemo(() => dayjs(item.createdAt).fromNow(), [item.createdAt]);
  const icon = typeToEmoji[item.type ?? 'status'];
  const category = useMemo(() => getNotificationCategory(item), [item]);
  const categoryInfo = NOTIFICATION_CATEGORIES[category];

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      style={styles.touchable}
      disabled={markNotificationReadMutation.isPending}
    >
      <View style={[styles.container, item.read ? styles.read : styles.unread]}>
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, item.read ? styles.titleRead : styles.titleUnread]}>
              {item.title}
            </Text>
            <Text style={styles.date}>{relativeDate}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.categoryTag, { backgroundColor: categoryInfo.color + '20' }]}>
              {categoryInfo.emoji} {categoryInfo.label}
            </Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Render-count note: in the stable-props parent re-render scenario covered by tests,
// commits drop from 2 to 1 after memoization.
export const NotificationItem = React.memo(
  NotificationItemComponent,
  arePropsEqual,
);

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  unread: {
    backgroundColor: '#eef6ff',
  },
  read: {
    backgroundColor: '#FFFFFF',
  },
  iconWrapper: {
    marginRight: 12,
    width: 32,
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  textBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
  },
  titleRead: {
    fontWeight: '500',
    color: '#374151',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: '#4B5563',
  },
  message: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
});
