'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Share, SafeAreaView, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MemberAvatarStack } from '../../components/groups/MemberAvatarStack';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useRefresh } from '../../hooks/useRefresh';

interface Member {
  address: string;
  name?: string;
  contributionAmount?: number;
  contributedAt?: string;
}

interface Contribution {
  id: string;
  memberAddress: string;
  memberName?: string;
  amount: number;
  timestamp: string;
  type: 'contribution' | 'payout';
}

interface PayoutSchedule {
  round: number;
  recipient: string;
  recipientName?: string;
  amount: number;
  date: string;
  status: 'upcoming' | 'completed' | 'pending';
}

interface GroupData {
  id: string;
  name: string;
  description: string;
  contractAddress: string;
  contributionAmount: number;
  payoutFrequency: string;
  maxMembers: number;
  createdAt: string;
  rules: string[];
  members: Member[];
  contributions: Contribution[];
  payoutSchedule: PayoutSchedule[];
  isCreator: boolean;
  currentUserAddress: string;
}

type TabKey = 'Members' | 'Payout Schedule' | 'Contribution History';
const TABS: TabKey[] = ['Members', 'Payout Schedule', 'Contribution History'];

// ── Tab content components (memoised) ────────────────────────────────────────

const MembersTab = memo(function MembersTab({ group, onViewAll }: { group: GroupData; onViewAll: () => void }) {
  return (
    <Card style={styles.card}>
      <MemberAvatarStack members={group.members} onViewAll={onViewAll} />
    </Card>
  );
});

const PayoutScheduleTab = memo(function PayoutScheduleTab({ schedule }: { schedule: PayoutSchedule[] }) {
  return (
    <Card style={styles.card}>
      {schedule.map((payout, index) => (
        <View key={payout.round}>
          <View style={styles.payoutItem}>
            <View style={styles.payoutInfo}>
              <Text style={styles.payoutRound}>Round {payout.round}</Text>
              <Text style={styles.payoutRecipient}>{payout.recipientName || payout.recipient}</Text>
              <Text style={styles.payoutDate}>{payout.date}</Text>
            </View>
            <View style={styles.payoutAmount}>
              <Text style={styles.amount}>${payout.amount}</Text>
              <View style={[styles.statusBadge, styles[payout.status]]}>
                <Text style={styles.statusText}>{payout.status}</Text>
              </View>
            </View>
          </View>
          {index < schedule.length - 1 && <Divider />}
        </View>
      ))}
    </Card>
  );
});

const ContributionHistoryTab = memo(function ContributionHistoryTab({ contributions }: { contributions: Contribution[] }) {
  return (
    <Card style={styles.card}>
      {contributions.slice(0, 5).map((c, index) => (
        <View key={c.id}>
          <View style={styles.contributionItem}>
            <View style={styles.contributionInfo}>
              <Text style={styles.contributor}>{c.memberName || c.memberAddress}</Text>
              <Text style={styles.contributionDate}>{c.timestamp}</Text>
            </View>
            <Text style={styles.contributionAmount}>${c.amount}</Text>
          </View>
          {index < Math.min(5, contributions.length) - 1 && <Divider />}
        </View>
      ))}
    </Card>
  );
});

// ── Lazy tab wrapper ──────────────────────────────────────────────────────────

function LazyTabContent({
  tabKey,
  activeTab,
  visitedTabs,
  group,
  onViewAllMembers,
}: {
  tabKey: TabKey;
  activeTab: TabKey;
  visitedTabs: Set<TabKey>;
  group: GroupData;
  onViewAllMembers: () => void;
}) {
  // Only render once the tab has been visited
  if (!visitedTabs.has(tabKey)) return null;

  const isActive = tabKey === activeTab;

  return (
    <View style={[styles.tabContent, !isActive && styles.hidden]}>
      {tabKey === 'Members' && <MembersTab group={group} onViewAll={onViewAllMembers} />}
      {tabKey === 'Payout Schedule' && <PayoutScheduleTab schedule={group.payoutSchedule} />}
      {tabKey === 'Contribution History' && <ContributionHistoryTab contributions={group.contributions} />}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function GroupDetailScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('Members');
  // Track which tabs have been visited — only fetch/render on first visit
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(new Set(['Members']));
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    const mockGroup: GroupData = {
      id: groupId,
      name: 'Family Savings Circle',
      description: 'A savings group for family members to save together and support each other',
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      contributionAmount: 100,
      payoutFrequency: 'monthly',
      maxMembers: 10,
      createdAt: '2024-01-15',
      rules: [
        'Each member contributes $100 monthly',
        'Payouts rotate equally among all members',
        'Members must contribute on time to remain eligible',
        'Emergency withdrawals require majority vote',
      ],
      members: [
        { address: '0x1234...5678', name: 'John Doe', contributionAmount: 100, contributedAt: '2024-04-01' },
        { address: '0xabcd...ef12', name: 'Jane Smith', contributionAmount: 100, contributedAt: '2024-04-01' },
        { address: '0x5678...9012', name: 'Mike Johnson', contributionAmount: 100, contributedAt: '2024-04-02' },
        { address: '0xdef0...3456', name: 'Sarah Williams', contributionAmount: 100, contributedAt: '2024-04-03' },
        { address: '0x7890...1234', name: 'Tom Brown', contributionAmount: 100, contributedAt: '2024-04-03' },
        { address: '0x3456...7890', name: 'Emily Davis', contributionAmount: 100, contributedAt: '2024-04-04' },
      ],
      contributions: [
        { id: '1', memberAddress: '0x1234...5678', memberName: 'John Doe', amount: 100, timestamp: '2024-04-01', type: 'contribution' },
        { id: '2', memberAddress: '0xabcd...ef12', memberName: 'Jane Smith', amount: 100, timestamp: '2024-04-01', type: 'contribution' },
        { id: '3', memberAddress: '0x5678...9012', memberName: 'Mike Johnson', amount: 100, timestamp: '2024-04-02', type: 'contribution' },
        { id: '4', memberAddress: '0xdef0...3456', memberName: 'Sarah Williams', amount: 100, timestamp: '2024-04-03', type: 'contribution' },
        { id: '5', memberAddress: '0x7890...1234', memberName: 'Tom Brown', amount: 100, timestamp: '2024-04-03', type: 'contribution' },
        { id: '6', memberAddress: '0x3456...7890', memberName: 'Emily Davis', amount: 100, timestamp: '2024-04-04', type: 'contribution' },
      ],
      payoutSchedule: [
        { round: 1, recipient: '0x1234...5678', recipientName: 'John Doe', amount: 600, date: '2024-05-01', status: 'upcoming' },
        { round: 2, recipient: '0xabcd...ef12', recipientName: 'Jane Smith', amount: 600, date: '2024-06-01', status: 'pending' },
        { round: 3, recipient: '0x5678...9012', recipientName: 'Mike Johnson', amount: 600, date: '2024-07-01', status: 'pending' },
      ],
      isCreator: true,
      currentUserAddress: '0x1234...5678',
    };

    setTimeout(() => {
      setGroup(mockGroup);
      setLoading(false);
    }, 1000);
  }, [groupId]);

  const refreshGroup = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    setGroup((current) => (current ? { ...current } : current));
  }, []);
  const { refreshing, onRefresh } = useRefresh(refreshGroup);

  const handleTabPress = useCallback(
    async (tab: TabKey) => {
      if (tab === activeTab) return;
      setActiveTab(tab);
      // Only trigger "fetch" on first visit — no duplicate fetch on revisit
      if (!visitedTabs.has(tab)) {
        setTabLoading(true);
        // Simulate lazy data fetch for this tab
        await new Promise((r) => setTimeout(r, 600));
        setVisitedTabs((prev) => new Set(prev).add(tab));
        setTabLoading(false);
      }
    },
    [activeTab, visitedTabs],
  );

  const handleShareInvite = useCallback(async () => {
    try {
      await Share.share({ message: `Join our savings group "${group?.name}"! Use invite code: ${group?.id}` });
    } catch {
      Alert.alert('Error', 'Failed to share invite');
    }
  }, [group]);

  const handleViewAllMembers = useCallback(() => {
    router.push(`/groups/${group?.id}/members` as never);
  }, [router, group?.id]);

  const groupStats = useMemo(
    () => (group ? [
      { label: 'Members', value: `${group.members.length}/${group.maxMembers}` },
      { label: 'Contribution', value: `$${group.contributionAmount}` },
      { label: 'Frequency', value: group.payoutFrequency },
    ] : []),
    [group],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShareInvite} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Group Info */}
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupDescription}>{group.description}</Text>
          <View style={styles.groupStats}>
            {groupStats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => handleTabPress(tab)}
                style={[styles.tab, isActive && styles.tabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab}</Text>
                {isActive && <View style={styles.tabIndicator} />}
              </Pressable>
            );
          })}
        </View>

        {/* Tab content — lazy: only rendered after first visit */}
        <View style={styles.tabContentArea}>
          {tabLoading ? (
            <LoadingSkeleton />
          ) : (
            TABS.map((tab) => (
              <LazyTabContent
                key={tab}
                tabKey={tab}
                activeTab={activeTab}
                visitedTabs={visitedTabs}
                group={group}
                onViewAllMembers={handleViewAllMembers}
              />
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
            <Text style={styles.primaryButtonText}>Make Contribution</Text>
          </TouchableOpacity>
          {group.isCreator && (
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
              <Text style={styles.secondaryButtonText}>Manage Group</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollView: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, padding: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#EF4444', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  shareButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  groupInfo: { marginBottom: 24 },
  groupName: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 },
  groupDescription: { fontSize: 16, color: '#94A3B8', marginBottom: 20, lineHeight: 24 },
  groupStats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  // Tab bar
  tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1E293B', marginBottom: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabActive: {},
  tabLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  tabLabelActive: { color: '#6366F1' },
  tabIndicator: { position: 'absolute', bottom: 0, width: '80%', height: 2, borderRadius: 1, backgroundColor: '#6366F1' },
  tabContentArea: { minHeight: 200 },
  tabContent: {},
  hidden: { display: 'none' },
  card: { marginBottom: 24 },
  // Payout schedule
  payoutItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  payoutInfo: { flex: 1 },
  payoutRound: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  payoutRecipient: { fontSize: 14, color: '#94A3B8', marginBottom: 2 },
  payoutDate: { fontSize: 12, color: '#64748B' },
  payoutAmount: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  upcoming: { backgroundColor: '#10B981' },
  completed: { backgroundColor: '#6366F1' },
  pending: { backgroundColor: '#F59E0B' },
  statusText: { fontSize: 10, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
  // Contribution history
  contributionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  contributionInfo: { flex: 1 },
  contributor: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  contributionDate: { fontSize: 12, color: '#64748B' },
  contributionAmount: { fontSize: 16, fontWeight: '600', color: '#10B981' },
  // Actions
  actionButtons: { marginTop: 24, marginBottom: 32, gap: 12 },
  actionButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: '#6366F1' },
  secondaryButton: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
