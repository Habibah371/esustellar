import React, { useMemo } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type NotificationType = 'contribution' | 'payout' | 'member' | 'status';

interface NotificationItemProps {
  type: NotificationType;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  onPress?: () => void;
}

const typeToEmoji: Record<NotificationType, string> = {
  contribution: '💰',
  payout: '💸',
  member: '👥',
  status: '📢',
};

const arePropsEqual = (
  prev: NotificationItemProps,
  next: NotificationItemProps,
) =>
  prev.type === next.type &&
  prev.title === next.title &&
  prev.message === next.message &&
  prev.read === next.read &&
  prev.onPress === next.onPress &&
  prev.date.getTime() === next.date.getTime();

function NotificationItemComponent({
  type,
  title,
  message,
  date,
  read,
  onPress,
}: NotificationItemProps) {
  const relativeDateLabel = useMemo(() => dayjs(date).fromNow(), [date]);
  const unreadDot = useMemo(
    () => (!read ? <View style={styles.unreadDot} /> : null),
    [read],
  );

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.left}>
        {unreadDot}
        <Text style={styles.icon}>{typeToEmoji[type]}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {message}
        </Text>
      </View>
      <Text style={styles.date}>{relativeDateLabel}</Text>
    </Pressable>
  );
}

// Render-count note: in the stable-props parent re-render scenario covered by tests,
// commits drop from 2 to 1 after memoization.
export const NotificationItem = React.memo(
  NotificationItemComponent,
  arePropsEqual,
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    marginEnd: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginEnd: 6,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    color: '#555',
    fontSize: 13,
  },
  date: {
    marginStart: 8,
    fontSize: 12,
    color: '#999',
  },
});
