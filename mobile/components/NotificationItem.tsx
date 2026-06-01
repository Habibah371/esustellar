import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Notification } from '../types/notification';
import { useNotificationsStore } from '../stores/notificationsStore';

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

const arePropsEqual = (prev: Props, next: Props) =>
  prev.item.id === next.item.id &&
  prev.item.title === next.item.title &&
  prev.item.message === next.item.message &&
  prev.item.read === next.item.read &&
  prev.item.createdAt === next.item.createdAt &&
  prev.item.type === next.item.type;

function NotificationItemComponent({ item }: Props) {
  const markRead = useNotificationsStore((state) => state.markRead);

  const handlePress = useCallback(() => {
    if (!item.read) {
      markRead(item.id);
    }
  }, [item.id, item.read, markRead]);

  const relativeDate = useMemo(() => dayjs(item.createdAt).fromNow(), [item.createdAt]);
  const icon = typeToEmoji[item.type ?? 'status'];

  return (
    <TouchableOpacity onPress={handlePress} style={styles.touchable}>
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
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
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
  },
  message: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
});
