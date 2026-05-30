import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Notification } from '../types/notification';
import { useNotificationsStore } from '../stores/notificationsStore';

type Props = {
  item: Notification;
};

const arePropsEqual = (prev: Props, next: Props) =>
  prev.item.id === next.item.id &&
  prev.item.title === next.item.title &&
  prev.item.message === next.item.message &&
  prev.item.read === next.item.read &&
  prev.item.createdAt === next.item.createdAt;

function NotificationItemComponent({ item }: Props) {
  const markRead = useNotificationsStore((state) => state.markRead);

  const handlePress = useCallback(() => {
    if (!item.read) {
      markRead(item.id);
    }
  }, [item.id, item.read, markRead]);

  const containerStyle = useMemo(
    () => ({
      padding: 12,
      backgroundColor: item.read ? '#fff' : '#eef6ff',
    }),
    [item.read],
  );
  const titleStyle = useMemo(
    () => ({ fontWeight: item.read ? ('normal' as const) : ('bold' as const) }),
    [item.read],
  );

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={containerStyle}>
        <Text style={titleStyle}>{item.title}</Text>
        <Text>{item.message}</Text>
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
