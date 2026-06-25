import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Analytics } from '../../utils/analytics';
import { Stack } from 'expo-router';

type PlanTier = 'Basic' | 'Pro' | 'Enterprise';

export default function SubscriptionManagementScreen() {
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('Basic');

  useEffect(() => {
    Analytics.logScreenView('SubscriptionManagement');
  }, []);

  const handlePlanChange = (newPlan: PlanTier) => {
    if (newPlan === currentPlan) {
      Alert.alert('Info', 'You are already on this plan.');
      return;
    }

    Alert.alert(
      'Confirm Subscription Change',
      `Are you sure you want to change your plan to ${newPlan}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            setCurrentPlan(newPlan);
            Analytics.logFeatureUsage('SubscriptionChange', { from: currentPlan, to: newPlan });
            Alert.alert('Success', `Your subscription has been updated to ${newPlan}.`);
          } 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Manage Subscription' }} />
      <View style={styles.header}>
        <Text style={styles.title}>Your Subscription</Text>
        <Text style={styles.subtitle}>Current Plan: <Text style={styles.highlight}>{currentPlan}</Text></Text>
      </View>

      <View style={styles.plansContainer}>
        {/* Basic Plan */}
        <View style={[styles.planCard, currentPlan === 'Basic' && styles.activePlan]}>
          <Text style={styles.planName}>Basic</Text>
          <Text style={styles.planPrice}>Free</Text>
          <Text style={styles.planDesc}>Essential features for getting started.</Text>
          <TouchableOpacity 
            style={[styles.button, currentPlan === 'Basic' && styles.buttonDisabled]} 
            onPress={() => handlePlanChange('Basic')}
            disabled={currentPlan === 'Basic'}
          >
            <Text style={styles.buttonText}>{currentPlan === 'Basic' ? 'Current Plan' : 'Downgrade'}</Text>
          </TouchableOpacity>
        </View>

        {/* Pro Plan */}
        <View style={[styles.planCard, currentPlan === 'Pro' && styles.activePlan]}>
          <Text style={styles.planName}>Pro</Text>
          <Text style={styles.planPrice}>$9.99 / month</Text>
          <Text style={styles.planDesc}>Advanced features for active users.</Text>
          <TouchableOpacity 
            style={[styles.button, currentPlan === 'Pro' && styles.buttonDisabled]} 
            onPress={() => handlePlanChange('Pro')}
            disabled={currentPlan === 'Pro'}
          >
            <Text style={styles.buttonText}>{currentPlan === 'Pro' ? 'Current Plan' : 'Upgrade to Pro'}</Text>
          </TouchableOpacity>
        </View>

        {/* Enterprise Plan */}
        <View style={[styles.planCard, currentPlan === 'Enterprise' && styles.activePlan]}>
          <Text style={styles.planName}>Enterprise</Text>
          <Text style={styles.planPrice}>$29.99 / month</Text>
          <Text style={styles.planDesc}>Full access and priority support.</Text>
          <TouchableOpacity 
            style={[styles.button, currentPlan === 'Enterprise' && styles.buttonDisabled]} 
            onPress={() => handlePlanChange('Enterprise')}
            disabled={currentPlan === 'Enterprise'}
          >
            <Text style={styles.buttonText}>{currentPlan === 'Enterprise' ? 'Current Plan' : 'Upgrade to Enterprise'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  plansContainer: {
    gap: 16,
    paddingBottom: 40,
  },
  planCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  activePlan: {
    borderColor: '#0066cc',
    borderWidth: 2,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 18,
    color: '#0066cc',
    marginBottom: 12,
    fontWeight: '600',
  },
  planDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
