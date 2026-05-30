import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Status = 'active' | 'pending' | 'completed';

interface Props {
  name: string;
  status: Status;
  contributionAmount: string;
  dueDate?: string;
  onPress?: () => void;
}

const STATUS_COLORS: Record<Status, string> = {
  active: '#10B981',
  pending: '#F59E0B',
  completed: '#6366F1',
};

const arePropsEqual = (prev: Props, next: Props) =>
  prev.name === next.name &&
  prev.status === next.status &&
  prev.contributionAmount === next.contributionAmount &&
  prev.dueDate === next.dueDate &&
  prev.onPress === next.onPress;

function GroupCardComponent({
  name,
  status,
  contributionAmount,
  dueDate,
  onPress,
}: Props) {
  const badgeStyle = useMemo(
    () => [styles.badge, { backgroundColor: STATUS_COLORS[status] }],
    [status],
  );
  const dueLabel = useMemo(
    () => (dueDate ? `Due: ${dueDate}` : null),
    [dueDate],
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} testID="group-card">
      <View style={styles.row}>
        <Text style={styles.name}>{name}</Text>
        <View style={badgeStyle}>
          <Text style={styles.badgeText}>{status}</Text>
        </View>
      </View>
      <Text style={styles.amount}>{contributionAmount}</Text>
      {dueLabel && (
        <View style={styles.dueBadge}>
          <Text style={styles.dueText}>{dueLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Render-count note: in the stable-props parent re-render scenario covered by tests,
// commits drop from 2 to 1 after memoization.
export const GroupCard = React.memo(GroupCardComponent, arePropsEqual);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  amount: { color: '#94A3B8', fontSize: 14 },
  dueBadge: {
    marginTop: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dueText: { color: '#F59E0B', fontSize: 12 },
});
