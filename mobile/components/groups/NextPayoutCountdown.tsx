'use client';

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NextPayoutCountdownProps {
  nextPayoutDate: string;
}

export function NextPayoutCountdown({ nextPayoutDate }: NextPayoutCountdownProps) {
  const calculateDaysUntil = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    const payoutDate = new Date(dateString);
    payoutDate.setHours(0, 0, 0, 0); // Set to start of day
    
    const diffTime = payoutDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysUntil = calculateDaysUntil(nextPayoutDate);
  
  const getCountdownText = () => {
    if (daysUntil === 0) return 'Payout due today!';
    if (daysUntil === 1) return 'Next payout in 1 day';
    return `Next payout in ${daysUntil} days`;
  };

  const getProgressPercentage = () => {
    // Assuming a 30-day cycle, calculate progress toward next payout
    const daysInCycle = 30;
    const daysElapsed = daysInCycle - daysUntil;
    return Math.max(0, Math.min(100, (daysElapsed / daysInCycle) * 100));
  };

  const progressPercentage = getProgressPercentage();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
        <Text style={styles.countdownText}>{getCountdownText()}</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% of cycle complete
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginStart: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
});
