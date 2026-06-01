'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  TextInput,
} from '../../../components/ui';
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

type FilterKey = 'all' | 'joined' | 'open';

type GroupsListItemProps = {
  group: Group;
  memberCountLabel: string;
  onPressGroup: (groupId: string) => void;
};

const FILTERS: FilterKey[] = ['all', 'joined', 'open'];

const FILTER_LABEL_KEYS: Record<
  FilterKey,
  'groups.filters.all' | 'groups.filters.joined' | 'groups.filters.open'
> = {
  all: 'groups.filters.all',
  joined: 'groups.filters.joined',
  open: 'groups.filters.open',
};

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

const STATUS_VARIANT_MAP: Record<
  GroupStatus,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  Active: 'success',
  Open: 'info',
  Paused: 'warning',
  Closed: 'error',
  Pending: 'neutral',
};

// Render-count note: in the stable-props parent re-render scenario,
// each row now commits once instead of twice.
const GroupsListItem = React.memo(
  function GroupsListItem({
    group,
    memberCountLabel,
    onPressGroup,
  }: GroupsListItemProps) {
    const handlePress = useCallback(() => {
      onPressGroup(group.id);
    }, [group.id, onPressGroup]);

    const formattedContribution = useMemo(
      () => formatXLM(group.contribution),
      [group.contribution],
    );

    return (
      <Pressable onPress={handlePress} style={styles.groupCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Badge
            label={group.status}
            variant={STATUS_VARIANT_MAP[group.status]}
          />
        </View>

        <View style={styles.cardRow}>
          <View>
            <Text style={styles.cardAmount}>{formattedContribution}</Text>
            <Text style={styles.cardMeta}>{group.frequency}</Text>
          </View>
          <Text style={styles.cardMeta}>{memberCountLabel}</Text>
        </View>
      </Pressable>
    );
  },
  (prev: GroupsListItemProps, next: GroupsListItemProps) =>
    prev.group.id === next.group.id &&
    prev.group.name === next.group.name &&
    prev.group.status === next.group.status &&
    prev.group.contribution === next.group.contribution &&
    prev.group.frequency === next.group.frequency &&
    prev.group.memberCount === next.group.memberCount &&
    prev.group.userJoined === next.group.userJoined &&
    prev.memberCountLabel === next.memberCountLabel &&
    prev.onPressGroup === next.onPressGroup,
);

function getFilteredGroups(filter: FilterKey) {
  switch (filter) {
    case 'joined':
      return MOCK_GROUPS.filter((group) => group.userJoined);
    case 'open':
      return MOCK_GROUPS.filter((group) => group.status === 'Open');
    default:
      return MOCK_GROUPS;
  }
}

export default function GroupsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchGroups = useCallback(
    async ({ showFullLoader = true } = {}) => {
      if (showFullLoader) {
        setLoading(true);
      }
      setError(null);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (Math.random() < 0.3) {
        setError(t('groups.errors.fetchFailed'));
        if (showFullLoader) {
          setLoading(false);
        }
        return;
      }

      setGroups(MOCK_GROUPS);
      if (showFullLoader) {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void fetchGroups();
  }, [fetchGroups]);

  const persistedGroupIds = useMemo(
    () => new Set(groups.map((group) => group.id)),
    [groups],
  );
  const normalizedSearchQuery = useMemo(
    () => debouncedSearchQuery.trim().toLowerCase(),
    [debouncedSearchQuery],
  );

  const filteredGroups = useMemo(
    () =>
      getFilteredGroups(activeFilter).filter(
        (group) =>
          persistedGroupIds.has(group.id) &&
          (normalizedSearchQuery === '' ||
            group.name.toLowerCase().includes(normalizedSearchQuery)),
      ),
    [activeFilter, normalizedSearchQuery, persistedGroupIds],
  );

  const refreshGroups = useCallback(
    () => fetchGroups({ showFullLoader: false }),
    [fetchGroups],
  );
  const { refreshing, onRefresh } = useRefresh(refreshGroups);

  const handlePressGroup = useCallback(
    (groupId: string) => {
      router.push(`/groups/${groupId}`);
    },
    [router],
  );

  const renderGroup = useCallback(
    ({ item }: { item: Group }) => (
      <GroupsListItem
        group={item}
        memberCountLabel={t('groups.memberCount', { count: item.memberCount })}
        onPressGroup={handlePressGroup}
      />
    ),
    [handlePressGroup, t],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('groups.title')}</Text>
        <TextInput
          placeholder={t('groups.searchPlaceholder')}
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
                isActive
                  ? styles.filterButtonActive
                  : styles.filterButtonInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  isActive && styles.filterLabelActive,
                ]}
              >
                {t(FILTER_LABEL_KEYS[filter])}
              </Text>
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
        <FlatList<Group>
          data={filteredGroups}
          keyExtractor={(item: Group) => item.id}
          renderItem={renderGroup}
          getItemLayout={(_: unknown, index: number) => ({
            length: 110,
            offset: 110 * index,
            index,
          })}
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
            <EmptyState
              tone="light"
              illustration="groups"
              title={t('groups.emptyTitle')}
              message={t('groups.emptyMessage')}
            />
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
    marginEnd: 10,
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
  },
});
