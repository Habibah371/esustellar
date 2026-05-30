'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FlatList, RefreshControl, SafeAreaView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, ErrorState, LoadingSkeleton, TextInput } from '../../../components/ui';
import { useDebounce } from '../../../hooks/useDebounce';
import { useRefresh } from '../../../hooks/useRefresh';
import { formatXLM } from '../../../utils/stellar';

type GroupStatus = 'Active' | 'Open' | 'Paused' | 'Closed' | 'Pending';
type Group = {
  id: string;
  name: string;
  status: GroupStatus;
  contribution: number;
  frequency: string;
  memberCount: number;
  userJoined: boolean;
};

type FilterKey = 'All' | 'Joined' | 'Open';

const FILTERS: FilterKey[] = ['All', 'Joined', 'Open'];

const MOCK_GROUPS: Group[] = [
  {
    id: '1',
    name: 'Solar Saver Collective',
    status: 'Active',
    contribution: 45,
    frequency: 'Monthly',
    memberCount: 8,
    userJoined: true,
  },
  {
    id: '2',
    name: 'Lunar Growth Syndicate',
    status: 'Open',
    contribution: 90,
    frequency: 'Biweekly',
    memberCount: 12,
    userJoined: false,
  },
  {
    id: '3',
    name: 'Horizon Funding Group',
    status: 'Open',
    contribution: 120,
    frequency: 'Weekly',
    memberCount: 5,
    userJoined: true,
  },
  {
    id: '4',
    name: 'Orbit Growth Fund',
    status: 'Paused',
    contribution: 60,
    frequency: 'Monthly',
    memberCount: 10,
    userJoined: false,
  },
];

const STATUS_VARIANT_MAP: Record<GroupStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  Active: 'success',
  Open: 'info',
  Paused: 'warning',
  Closed: 'error',
  Pending: 'neutral',
};

function getFilteredGroups(filter: FilterKey) {
  switch (filter) {
    case 'Joined':
      return MOCK_GROUPS.filter((group) => group.userJoined);
    case 'Open':
      return MOCK_GROUPS.filter((group) => group.status === 'Open');
    default:
      return MOCK_GROUPS;
  }
}

export default function GroupsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchGroups = useCallback(async ({ showFullLoader = true } = {}) => {
    if (showFullLoader) {
      setLoading(true);
    }
    setError(null);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // 30% failure rate simulation
    if (Math.random() < 0.3) {
      setError('Failed to fetch groups. Please check your connection and try again.');
      if (showFullLoader) {
        setLoading(false);
      }
      return;
    }
    
    setGroups(MOCK_GROUPS);
    if (showFullLoader) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filteredGroups = useMemo(
    () =>
      getFilteredGroups(activeFilter).filter(
        (g) =>
          groups.some((pg) => pg.id === g.id) &&
          (debouncedSearchQuery === '' ||
            g.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())),
      ),
    [activeFilter, groups, debouncedSearchQuery],
  );

  const refreshGroups = useCallback(
    () => fetchGroups({ showFullLoader: false }),
    [fetchGroups],
  );
  const { refreshing, onRefresh } = useRefresh(refreshGroups);

  // useCallback: stable reference prevents FlatList from re-rendering all items on parent update
  const renderGroup = useCallback(({ item }: { item: Group }) => (
    <Pressable
      key={item.id}
      onPress={() => router.push(`/groups/${item.id}`)}
      style={styles.groupCard}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Badge label={item.status} variant={STATUS_VARIANT_MAP[item.status]} />
      </View>

      <View style={styles.cardRow}>
        <View>
          <Text style={styles.cardAmount}>{formatXLM(item.contribution)}</Text>
          <Text style={styles.cardMeta}>{item.frequency}</Text>
        </View>
        <Text style={styles.cardMeta}>{item.memberCount} members</Text>
      </View>
    </Pressable>
  ), [router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <TextInput
          placeholder="Search groups..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          containerStyle={styles.searchContainer}
        />
      </View>

      <View style={styles.filterBar}>
        {FILTERS.map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterButton,
                isActive ? styles.filterButtonActive : styles.filterButtonInactive,
              ]}
            >
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>{filter}</Text>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchGroups} />
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          getItemLayout={(_, index) => ({ length: 110, offset: 110 * index, index })}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0F172A"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No groups to show</Text>
              <Text style={styles.emptyMessage}>Try another filter to see matching groups.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CBD5E1',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  searchContainer: {
    marginTop: 12,
    marginBottom: 0,
  },
  searchInput: {
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    borderColor: '#E2E8F0',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 999,
  },
  filterButtonActive: {
    backgroundColor: '#0F172A',
  },
  filterButtonInactive: {
    backgroundColor: '#E2E8F0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  activeIndicator: {
    marginTop: 6,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  groupCard: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groupName: {
    flex: 1,
    marginRight: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardMeta: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 260,
  },
});
