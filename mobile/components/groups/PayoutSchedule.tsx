'use client';

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../utils/formatDate';

type RoundStatus = 'upcoming' | 'completed' | 'current';

type Round = {
  round: number;
  recipient: string;
  date: string;
  status: RoundStatus;
};

interface PayoutScheduleProps {
  rounds: Round[];
}

export function PayoutSchedule({ rounds }: PayoutScheduleProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusIcon = (status: RoundStatus) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
      case 'current':
        return <Ionicons name="time" size={20} color="#F59E0B" />;
      case 'upcoming':
        return <Ionicons name="ellipse-outline" size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: RoundStatus) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'current':
        return '#FEF3C7';
      case 'upcoming':
        return 'transparent';
    }
  };

  const getRowStyle = (status: RoundStatus) => {
    const baseStyle = styles.row;
    if (status === 'current') {
      return [baseStyle, styles.currentRow];
    }
    return baseStyle;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payout Schedule</Text>
      </View>
      
      {rounds.map((round) => (
        <View
          key={round.round}
          style={[
            getRowStyle(round.status),
            { backgroundColor: getStatusColor(round.status) }
          ]}
        >
          <View style={styles.roundColumn}>
            <Text style={[
              styles.roundText,
              round.status === 'current' && styles.currentText
            ]}>
              Round {round.round}
            </Text>
          </View>
          
          <View style={styles.recipientColumn}>
            <Text style={[
              styles.recipientText,
              round.status === 'current' && styles.currentText
            ]}>
              {truncateAddress(round.recipient)}
            </Text>
          </View>
          
          <View style={styles.dateColumn}>
            <Text style={[
              styles.dateText,
              round.status === 'current' && styles.currentText
            ]}>
              {formatDate(round.date, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          
          <View style={styles.statusColumn}>
            {getStatusIcon(round.status)}
          </View>
        </View>
      ))}
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
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  currentRow: {
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  roundColumn: {
    flex: 0.8,
  },
  recipientColumn: {
    flex: 1.2,
  },
  dateColumn: {
    flex: 1,
  },
  statusColumn: {
    flex: 0.5,
    alignItems: 'center',
  },
  roundText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  recipientText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  currentText: {
    color: '#F1F5F9',
    fontWeight: '600',
  },
});
