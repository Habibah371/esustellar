import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TextInput } from '../../../components/ui/TextInput';
import Button from '../../../components/ui/Button';

const MIN_SIZE = 2;
const MAX_SIZE = 20;

export default function CreateGroupStep2() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupName: string; description: string }>();

  const [size, setSize] = useState(5);
  const [contribution, setContribution] = useState('');
  const [contributionError, setContributionError] = useState('');

  const parsedAmount = parseFloat(contribution);
  const totalPool = size * (isNaN(parsedAmount) ? 0 : parsedAmount);

  const handleNext = () => {
    const amount = parseFloat(contribution);
    if (!contribution.trim() || isNaN(amount) || amount <= 0) {
      setContributionError('Enter a valid contribution amount');
      return;
    }
    setContributionError('');
    router.push({
      pathname: '/groups/create/confirm',
      params: {
        groupName: params.groupName,
        description: params.description,
        maxMembers: String(size),
        contributionAmount: contribution,
        payoutFrequency: 'monthly',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.step}>Step 2 of 3</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Group Size ({MIN_SIZE}–{MAX_SIZE} members)</Text>
        <View style={styles.picker}>
          <TouchableOpacity
            onPress={() => setSize((s) => Math.max(MIN_SIZE, s - 1))}
            style={styles.pickerBtn}
            accessibilityLabel="Decrease group size"
          >
            <Text style={styles.pickerBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.pickerValue}>{size} members</Text>
          <TouchableOpacity
            onPress={() => setSize((s) => Math.min(MAX_SIZE, s + 1))}
            style={styles.pickerBtn}
            accessibilityLabel="Increase group size"
          >
            <Text style={styles.pickerBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          label="Contribution Amount (XLM)"
          value={contribution}
          onChangeText={(v) => {
            setContribution(v);
            if (contributionError) setContributionError('');
          }}
          placeholder="e.g. 100"
          keyboardType="numeric"
          error={contributionError}
        />

        <View style={styles.poolCard}>
          <Text style={styles.poolLabel}>Total pool per round</Text>
          <Text style={styles.poolValue}>{totalPool.toFixed(2)} XLM</Text>
        </View>

        <View style={styles.actions}>
          <Button variant="outline" onPress={() => router.back()} style={styles.btn}>
            Back
          </Button>
          <Button onPress={handleNext} style={styles.btn}>
            Next
          </Button>
        </View>
      </ScrollView>
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
  step: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 8 },
  content: { padding: 16, paddingBottom: 40 },
  label: { color: '#fff', fontSize: 14, marginBottom: 8 },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  pickerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBtnText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  pickerValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  poolCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poolLabel: { color: '#94A3B8', fontSize: 14 },
  poolValue: { color: '#6366F1', fontSize: 18, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1 },
});