'use client';

import React, { useCallback } from 'react';
import { SafeAreaView, View, Text, Pressable, StyleSheet, Alert, FlatList, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Badge } from '../../../components/ui/Badge';
import { MemberAvatarStack } from '../../../components/groups/MemberAvatarStack';
import { useRefresh } from '../../../hooks/useRefresh';
import { formatXLM } from '../../../utils/stellar';

type Member = {
  address: string;
  name?: string;
};

type Group = {
  id: string;
  name: string;
  status: 'Active' | 'Paused' | 'Closed' | 'Pending';
  contribution: number;
  frequency: string;
  memberCount: number;
  members: Member[];
  inviteCode?: string;
  isOwner?: boolean;
};

const MOCK_GROUPS: Group[] = [
  {
    id: '1',
    name: 'Solar Saver Collective',
    status: 'Active',
    contribution: 45,
    frequency: 'Monthly',
    memberCount: 8,
    members: [
      { address: 'GABCD1234', name: 'Amina' },
      { address: 'GXYZ5678', name: 'Noah' },
      { address: 'GQWER0987', name: 'Sophia' },
      { address: 'GJKL4321', name: 'Mia' },
      { address: 'GMNO2890', name: 'Leo' },
      { address: 'GPDRT1111', name: 'Aria' },
    ],
    inviteCode: 'ESU-ABCD-1234',
    isOwner: true,
  },
  {
    id: '2',
    name: 'Lunar Growth Syndicate',
    status: 'Paused',
    contribution: 90,
    frequency: 'Biweekly',
    memberCount: 12,
    members: [
      { address: 'GHIJK1234', name: 'Noah' },
      { address: 'GLMNO5678', name: 'Eli' },
    ],
    inviteCode: 'ESU-EFGH-5678',
    isOwner: false,
  },
  {
    id: '3',
    name: 'Horizon Funding Group',
    status: 'Pending',
    contribution: 120,
    frequency: 'Weekly',
    memberCount: 5,
    members: [{ address: 'GPQRZ9876', name: 'Zoe' }],
    inviteCode: 'ESU-IJKL-9012',
    isOwner: false,
  },
];

const STATUS_VARIANT_MAP: Record<Group['status'], 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  Active: 'success',
  Paused: 'warning',
  Closed: 'error',
  Pending: 'info',
};

function InviteCodeRow({ inviteCode }: { inviteCode: string }) {
  const handleCopyInviteCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert('Success', 'Invite code copied!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy invite code');
    }
  };

  return (
    <View style={styles.inviteCodeRow}>
      <Text style={styles.inviteCodeLabel}>Invite Code:</Text>
      <Text style={styles.inviteCodeValue}>{inviteCode}</Text>
      <Pressable onPress={handleCopyInviteCode} style={styles.copyButton}>
        <Ionicons name="copy-outline" size={20} color="#6B7280" />
      </Pressable>
    </View>
  );
}

function GroupDetailHeader({ group }: { group: Group }) {
  return (
    <View style={styles.groupHeader}>
      <View style={styles.titleRow}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Badge label={group.status} variant={STATUS_VARIANT_MAP[group.status]} />
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.contributionAmount}>{formatXLM(group.contribution)}</Text>
        <Text style={styles.frequencyText}>{group.frequency}</Text>
      </View>

      <Text style={styles.memberText}>{group.memberCount} members</Text>
      
      {group.isOwner && group.inviteCode && (
        <InviteCodeRow inviteCode={group.inviteCode} />
      )}
    </View>
  );
}

type Section = { key: string };

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string }>();
  const groupId = params.groupId ?? '';
  const group = MOCK_GROUPS.find((item) => item.id === groupId) || null;
  const refreshGroup = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
  }, []);
  const { refreshing, onRefresh } = useRefresh(refreshGroup);

  const sections: Section[] = group
    ? [{ key: 'header' }, { key: 'members' }, { key: 'overview' }, { key: 'groupId' }]
    : [{ key: 'notFound' }];

  const renderItem = ({ item }: { item: Section }) => {
    if (!group) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Group not found</Text>
          <Text style={styles.sectionText}>
            No mock group was found for the requested ID. Use a valid group link to see details.
          </Text>
        </View>
      );
    }
    switch (item.key) {
      case 'header':
        return <GroupDetailHeader group={group} />;
      case 'members':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Members</Text>
            <MemberAvatarStack members={group.members} onViewAll={() => {}} />
          </View>
        );
      case 'overview':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Overview</Text>
            <Text style={styles.sectionText}>
              This is the group detail screen for &quot;{group.name}&quot;. The group has a contribution amount of {formatXLM(group.contribution)} paid {group.frequency.toLowerCase()}, and currently includes {group.memberCount} members.
            </Text>
          </View>
        );
      case 'groupId':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Group ID</Text>
            <Text style={styles.sectionText}>{groupId}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Group Details</Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0F172A"
            colors={['#0F172A']}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  backButtonText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  screenTitle: {
    marginStart: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    padding: 16,
  },
  groupHeader: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginEnd: 12,
  },
  amountRow: {
    marginBottom: 8,
  },
  contributionAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
  },
  frequencyText: {
    marginTop: 6,
    fontSize: 16,
    color: '#475569',
  },
  memberText: {
    fontSize: 15,
    color: '#475569',
    opacity: 0.9,
  },
  section: {
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  sectionHeading: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inviteCodeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginEnd: 8,
  },
  inviteCodeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  copyButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
});
