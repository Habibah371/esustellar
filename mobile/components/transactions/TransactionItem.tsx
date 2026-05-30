import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatXLM } from '../../utils/stellar';

export type TransactionType = 'contribution' | 'payout' | 'fee';

interface Props {
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
}

const ICON: Record<TransactionType, string> = {
  contribution: '↑',
  payout: '↓',
  fee: '−',
};

const COLOR: Record<TransactionType, string> = {
  contribution: '#EF4444',
  payout: '#22C55E',
  fee: '#94A3B8',
};

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const arePropsEqual = (prev: Props, next: Props) =>
  prev.type === next.type &&
  prev.description === next.description &&
  prev.amount === next.amount &&
  prev.date === next.date;

function TransactionItemComponent({ type, description, amount, date }: Props) {
  const color = useMemo(() => COLOR[type], [type]);
  const iconBackgroundColor = useMemo(() => color + '20', [color]);
  const formattedAmount = useMemo(() => formatXLM(amount), [amount]);
  const relativeDateLabel = useMemo(() => relativeDate(date), [date]);

  return (
    <View style={styles.row} accessibilityRole="text">
      <View style={[styles.icon, { backgroundColor: iconBackgroundColor }]}>
        <Text style={[styles.iconText, { color }]}>{ICON[type]}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.desc} numberOfLines={1}>
          {description}
        </Text>
        <Text style={styles.date}>{relativeDateLabel}</Text>
      </View>
      <Text style={[styles.amount, { color }]}>{formattedAmount}</Text>
    </View>
  );
}

// Render-count note: in the stable-props parent re-render scenario covered by tests,
// commits drop from 2 to 1 after memoization.
export const TransactionItem = React.memo(
  TransactionItemComponent,
  arePropsEqual,
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 16, fontWeight: '700' },
  info: { flex: 1 },
  desc: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  date: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '600' },
});
