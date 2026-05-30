import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TransactionItem, TransactionType } from '../../components/transactions/TransactionItem';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRefresh } from '../../hooks/useRefresh';

interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
}

const PAGE_SIZE = 10;

function generateMockTransactions(page: number): Transaction[] {
  const base = page * PAGE_SIZE;
  return Array.from({ length: PAGE_SIZE }, (_, i) => ({
    id: `tx-${base + i}`,
    type: (['contribution', 'payout', 'fee'] as TransactionType[])[i % 3],
    description: ['Monthly contribution', 'Payout received', 'Platform fee'][i % 3],
    amount: [50, 250, 2.5][i % 3],
    date: new Date(Date.now() - (base + i) * 86400000).toISOString(),
  }));
}

export default function TransactionHistory() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(async (
    pageNum: number,
    { reset = false, showFullLoader = true } = {},
  ) => {
    if (pageNum === 0 && showFullLoader) {
      setLoading(true);
    } else if (pageNum > 0) {
      setLoadingMore(true);
    }

    try {
      await new Promise((r) => setTimeout(r, 600));
      const data = generateMockTransactions(pageNum);
      setTransactions((prev) => (reset ? data : [...prev, ...data]));
      setHasMore(pageNum < 2);
      setPage(pageNum);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadPage(0); }, [loadPage]);

  const handleRefresh = useCallback(
    () => loadPage(0, { reset: true, showFullLoader: false }),
    [loadPage],
  );
  const { refreshing, onRefresh } = useRefresh(handleRefresh);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && !refreshing && hasMore) loadPage(page + 1);
  }, [loadingMore, refreshing, hasMore, page, loadPage]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#6366F1" size="large" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              type={item.type}
              description={item.description}
              amount={item.amount}
              date={item.date}
            />
          )}
          contentContainerStyle={[
            styles.list,
            transactions.length === 0 && styles.listEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon="📭"
              title="No transactions yet"
              message="Your contributions and payouts will appear here."
            />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color="#6366F1" style={styles.footer} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  listEmpty: { flex: 1 },
  separator: { height: 1, backgroundColor: '#1E293B' },
  footer: { paddingVertical: 16 },
});
