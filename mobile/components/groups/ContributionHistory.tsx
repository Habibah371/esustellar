'use client';

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { EmptyState } from '../ui/EmptyState';
import { formatXLM } from '../../utils/stellar';
import { formatDate } from '../../utils/formatDate';

type Transaction = {
  contributor: string;
  amount: number;
  date: string;
  round: number;
};

interface ContributionHistoryProps {
  transactions: Transaction[];
}

export function ContributionHistory({ transactions }: ContributionHistoryProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionRow}>
      <View style={styles.contributorColumn}>
        <Text style={styles.contributorText}>{truncateAddress(item.contributor)}</Text>
      </View>
      
      <View style={styles.amountColumn}>
        <Text style={styles.amountText}>{formatXLM(item.amount)}</Text>
      </View>
      
      <View style={styles.dateColumn}>
        <Text style={styles.dateText}>
          {formatDate(item.date, { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
      
      <View style={styles.roundColumn}>
        <Text style={styles.roundText}>R{item.round}</Text>
      </View>
    </View>
  );

  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <SectionHeader title="Contribution History" />
        <EmptyState
          tone="dark"
          illustration="transactions"
          title="No contributions yet"
          message="Contributions will appear here once members start contributing to the group."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader title="Contribution History" />
      <View style={styles.listContainer}>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item: Transaction, index: number) => `${item.contributor}-${item.round}-${index}`}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  listContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contributorColumn: {
    flex: 1.2,
  },
  amountColumn: {
    flex: 0.8,
  },
  dateColumn: {
    flex: 1,
  },
  roundColumn: {
    flex: 0.5,
    alignItems: 'center',
  },
  contributorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  roundText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
});
