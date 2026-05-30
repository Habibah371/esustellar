import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmptyState } from '../../components/ui';
import { formatDate } from '../../utils/formatDate';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Referral {
  id: string;
  referredUser: string; // masked display name e.g. "Jane D."
  joinedAt: string;     // ISO date string
  rewardEarned: number; // XLM
  status: 'pending' | 'confirmed';
}

interface ReferralStats {
  code: string;
  totalReferrals: number;
  confirmedReferrals: number;
  totalRewardsXLM: number;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const REFERRAL_CODE_KEY = 'referral:code';
const REFERRAL_LIST_KEY = 'referral:list';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generates a unique referral code tied to the user's wallet public key.
 * Format: ESU-XXXXXX  (first 6 chars of the public key, uppercased)
 */
function generateReferralCode(publicKey: string): string {
  const seed = publicKey.replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return `ESU-${seed}`;
}

/**
 * Persists the referral code so it survives app restarts.
 */
async function getOrCreateReferralCode(publicKey: string): Promise<string> {
  const existing = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
  if (existing) return existing;
  const code = generateReferralCode(publicKey);
  await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
  return code;
}

/**
 * In a real implementation this would call your backend.
 * Here we read from local storage so the feature works offline/in dev.
 */
async function fetchReferrals(): Promise<Referral[]> {
  const raw = await AsyncStorage.getItem(REFERRAL_LIST_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Referral[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReferralCodeCard({
  code,
  onCopy,
  onShare,
}: {
  code: string;
  onCopy: () => void;
  onShare: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Your referral code</Text>
      <Text style={styles.codeText} selectable>{code}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.btnSecondary} onPress={onCopy} accessibilityLabel="Copy referral code">
          <Text style={styles.btnSecondaryText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={onShare} accessibilityLabel="Share referral code">
          <Text style={styles.btnPrimaryText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatsRow({ stats }: { stats: ReferralStats }) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{stats.totalReferrals}</Text>
        <Text style={styles.statLabel}>Invited</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{stats.confirmedReferrals}</Text>
        <Text style={styles.statLabel}>Confirmed</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{stats.totalRewardsXLM} XLM</Text>
        <Text style={styles.statLabel}>Earned</Text>
      </View>
    </View>
  );
}

function ReferralRow({ item }: { item: Referral }) {
  const date = formatDate(item.joinedAt, { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <View style={styles.referralRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.referredUser[0]}</Text>
      </View>
      <View style={styles.referralInfo}>
        <Text style={styles.referralName}>{item.referredUser}</Text>
        <Text style={styles.referralDate}>Joined {date}</Text>
      </View>
      <View style={[styles.badge, item.status === 'confirmed' ? styles.badgeConfirmed : styles.badgePending]}>
        <Text style={[styles.badgeText, item.status === 'confirmed' ? styles.badgeTextConfirmed : styles.badgeTextPending]}>
          {item.status === 'confirmed' ? `+${item.rewardEarned} XLM` : 'Pending'}
        </Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

interface ReferralsScreenProps {
  /** Pass the active wallet's Stellar public key */
  publicKey: string;
}

export default function ReferralsScreen({ publicKey }: ReferralsScreenProps) {
  const [code, setCode] = useState<string>('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const [resolvedCode, resolvedReferrals] = await Promise.all([
        getOrCreateReferralCode(publicKey),
        fetchReferrals(),
      ]);
      setCode(resolvedCode);
      setReferrals(resolvedReferrals);
      setLoading(false);
    }
    void init();
  }, [publicKey]);

  const stats: ReferralStats = {
    code,
    totalReferrals: referrals.length,
    confirmedReferrals: referrals.filter((r) => r.status === 'confirmed').length,
    totalRewardsXLM: referrals
      .filter((r) => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.rewardEarned, 0),
  };

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'Referral code copied to clipboard.');
  }, [code]);

  const handleShare = useCallback(async () => {
    await Share.share({
      message: `Join EsuStellar — a transparent savings community on Stellar! Use my referral code ${code} when you sign up: https://esustellar.app/join?ref=${code}`,
    });
  }, [code]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={referrals}
      keyExtractor={(item: Referral) => item.id}
      ListHeaderComponent={
        <>
          <Text style={styles.heading}>Invite & earn</Text>
          <Text style={styles.subheading}>
            Earn 2 XLM for every friend who joins and makes their first contribution.
          </Text>
          <ReferralCodeCard code={code} onCopy={handleCopy} onShare={handleShare} />
          <StatsRow stats={stats} />
          {referrals.length > 0 && <Text style={styles.sectionTitle}>Your referrals</Text>}
        </>
      }
      renderItem={({ item }: { item: Referral }) => <ReferralRow item={item} />}
      ListEmptyComponent={
        <EmptyState
          tone="light"
          illustration="default"
          title="No referrals yet"
          message="Share your code to get started!"
        />
      }
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  heading: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  subheading: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  codeText: { fontSize: 28, fontWeight: '800', color: '#3B82F6', letterSpacing: 2, marginBottom: 16 },
  cardActions: { flexDirection: 'row', gap: 12 },
  btnPrimary: {
    flex: 1, backgroundColor: '#3B82F6', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnSecondary: {
    flex: 1, backgroundColor: '#EFF6FF', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  btnSecondaryText: { color: '#3B82F6', fontWeight: '600', fontSize: 15 },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 4 },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12 },

  referralRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },
  referralInfo: { flex: 1 },
  referralName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  referralDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeConfirmed: { backgroundColor: '#D1FAE5' },
  badgePending: { backgroundColor: '#FEF9C3' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextConfirmed: { color: '#065F46' },
  badgeTextPending: { color: '#92400E' },

});
