import React, { useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { triggerHapticFeedback } from '../../utils/haptics';
import { Button } from '../../components/ui/Button';

export default function ContributionSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupName?: string; amount?: string; txHash?: string }>();
  const groupName = params.groupName ?? 'Unknown Group';

  useEffect(() => { triggerHapticFeedback.success(); }, []);
  const amount = params.amount ?? '0 XLM';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>Contribution Successful!</Text>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Group</Text>
            <Text style={styles.detailValue}>{groupName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Contributed</Text>
            <Text style={styles.detailValue}>{amount}</Text>
          </View>
        </View>

        {/* Transaction Hash */}
        {params.txHash && (
          <View style={styles.hashContainer}>
            <Text style={styles.hashLabel}>Transaction ID</Text>
            <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
              {params.txHash}
            </Text>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button variant="outline" size="lg" onPress={() => router.replace('/(tabs)')} style={styles.button}>
          Back to Home
        </Button>
        <Button variant="primary" size="lg" onPress={() => router.back()} style={styles.button}>
          View Group
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#14532D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#14532D',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  checkmark: {
    fontSize: 64,
    fontWeight: '800',
    color: '#4ADE80',
    lineHeight: 64,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 24,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: I18nManager.isRTL ? 'left' : 'right',
    flex: 1,
    paddingStart: 12,
  },
  hashContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    marginTop: 8,
  },
  hashLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  hashValue: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  spacer: {
    height: 20,
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
