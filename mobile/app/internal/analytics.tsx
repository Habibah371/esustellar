import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Analytics } from '../../utils/analytics';
import { Stack } from 'expo-router';

interface MetricData {
  activeSessions: number;
  topFeatures: { name: string; uses: number }[];
  totalUsers: number;
}

export default function InternalAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Analytics.logScreenView('InternalAnalyticsDashboard');
    
    Analytics.getInternalMetrics().then((data) => {
      setMetrics(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Internal Analytics' }} />
      <Text style={styles.title}>Usage Analytics Dashboard</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Global Metrics</Text>
        <Text style={styles.metricText}>Total Users: {metrics.totalUsers}</Text>
        <Text style={styles.metricText}>Active Sessions: {metrics.activeSessions}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Feature Adoption (Top Events)</Text>
        {metrics?.topFeatures.map((f: { name: string; uses: number }, idx: number) => (
          <View key={idx} style={styles.featureRow}>
            <Text style={styles.featureName}>{f.name}</Text>
            <Text style={styles.featureCount}>{f.uses} uses</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
  },
  metricText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  featureName: {
    fontSize: 16,
    color: '#333',
  },
  featureCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
});
