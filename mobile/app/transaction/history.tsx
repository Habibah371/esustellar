import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TransactionItem, TransactionType } from '../../components/transactions/TransactionItem';
import { useRefresh } from '../../hooks/useRefresh';

type TabKey = 'All' | 'Contributions' | 'Payouts';

const TABS: TabKey[] = ['All', 'Contributions', 'Payouts'];

const TAB_TYPE_MAP: Record<TabKey, TransactionType | null> = {
  All: null,
  Contributions: 'contribution',
  Payouts: 'payout',
};

type Transaction = {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
};

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'contribution', description: 'Monthly contribution – Solar Saver', amount: 45, date: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', type: 'payout', description: 'Payout received – Lunar Growth', amount: 540, date: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', type: 'fee', description: 'Network fee', amount: 0.00001, date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '4', type: 'contribution', description: 'Monthly contribution – Horizon Fund', amount: 120, date: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: '5', type: 'payout', description: 'Payout received – Solar Saver', amount: 360, date: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: '6', type: 'contribution', description: 'Monthly contribution – Orbit Fund', amount: 60, date: new Date(Date.now() - 86400000 * 15).toISOString() },
];

const ITEM_HEIGHT = 60; // paddingVertical 12 * 2 + ~36 content

const FilterTabs = memo(function FilterTabs({
  active,
  counts,
  onSelect,
}: {
  active: TabKey;
  counts: Record<TabKey, number>;
  onSelect: (tab: TabKey) => void;
}) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => onSelect(tab)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab} ({counts[tab]})
            </Text>
            {isActive && <View style={styles.tabIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
});

const keyExtractor = (item: Transaction) => item.id;

const getItemLayout = (_: unknown, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('All');
  const [data, setData] = useState(MOCK_TRANSACTIONS);

  const counts = useMemo<Record<TabKey, number>>(
    () => ({
      All: data.length,
      Contributions: data.filter((t) => t.type === 'contribution').length,
      Payouts: data.filter((t) => t.type === 'payout').length,
    }),
    [data],
  );

  const filtered = useMemo(() => {
    const typeFilter = TAB_TYPE_MAP[activeTab];
    return typeFilter ? data.filter((t) => t.type === typeFilter) : data;
  }, [activeTab, data]);

  const refreshTransactions = useCallback(async () => {
    // Replace with real fetch
    await new Promise((r) => setTimeout(r, 800));
    setData([...MOCK_TRANSACTIONS]);
  }, []);
  const { refreshing, onRefresh } = useRefresh(refreshTransactions);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Transaction>) => (
      <TransactionItem
        type={item.type}
        description={item.description}
        amount={item.amount}
        date={item.date}
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      <FilterTabs active={activeTab} counts={counts} onSelect={setActiveTab} />

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} to show.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1E293B',
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#1E293B' },
  backBtnText: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  title: { marginLeft: 14, fontSize: 18, fontWeight: '800', color: '#F8FAFC' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1E293B',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    marginHorizontal: 4,
  },
  tabActive: {},
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabLabelActive: { color: '#6366F1' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '80%',
    height: 2,
    borderRadius: 1,
    backgroundColor: '#6366F1',
  },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  empty: { marginTop: 48, alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 15 },
});
