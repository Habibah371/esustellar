import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const ONBOARDING_KEY = 'onboardingComplete';

const STEPS = [
  {
    icon: '👥',
    title: 'Create or join a savings group',
    description: 'Start a new group or join an existing one in your community.',
  },
  {
    icon: '💳',
    title: 'Contribute monthly with your Stellar wallet',
    description: 'Send your fixed contribution each month using your Stellar wallet.',
  },
  {
    icon: '🔄',
    title: 'Receive payouts in rotating order',
    description: 'Each member receives the full pool in a fair, transparent rotation.',
  },
];

export default function HowItWorksScreen() {
  const router = useRouter();

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/wallet/connect');
  };

  return (
    <SafeAreaView style={styles.container} testID="how-it-works-screen">
      <Text style={styles.heading}>How It Works</Text>

      {STEPS.map((step, index) => (
        <View key={index} style={styles.step}>
          <Text style={styles.stepNumber}>{index + 1}</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        </View>
      ))}

      <View style={styles.nav}>
        <Pressable
          accessibilityRole="button"
          style={styles.navButton}
          onPress={() => router.back()}
          testID="how-it-works-back"
        >
          <Text style={styles.navButtonText}>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={handleGetStarted}
          testID="how-it-works-get-started"
        >
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>Get Started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24, paddingTop: 48 },
  heading: { fontSize: 24, fontWeight: '700', color: '#F1F5F9', marginBottom: 32 },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 28 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E3A5F',
    color: '#60A5FA',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 28,
    marginEnd: 16,
    marginTop: 2,
  },
  stepContent: { flex: 1 },
  stepIcon: { fontSize: 24, marginBottom: 4 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: '#F1F5F9', marginBottom: 4 },
  stepDescription: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 32,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  navButtonPrimary: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  navButtonText: { color: '#94A3B8', fontWeight: '600', fontSize: 15 },
  navButtonTextPrimary: { color: '#FFFFFF' },
});
