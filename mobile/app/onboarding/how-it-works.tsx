import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const STEPS = [
  { icon: '👥', title: 'Create or join a savings group', description: 'Start a new group or join an existing one in your community.' },
  { icon: '💳', title: 'Contribute monthly with your Stellar wallet', description: 'Send your fixed contribution each month using your Stellar wallet.' },
  { icon: '🔄', title: 'Receive payouts in rotating order', description: 'Each member receives the full pool in a fair, transparent rotation.' },
];

interface Props {
  navigation?: { goBack: () => void; navigate: (screen: string) => void };
}

export default function HowItWorksScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.skip} onPress={() => navigation?.navigate('Home')}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

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
        <Pressable style={styles.navButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.navButtonText}>Back</Text>
        </Pressable>
        <Pressable style={[styles.navButton, styles.navButtonPrimary]} onPress={() => navigation?.navigate('SignUp')}>
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24, paddingTop: 48 },
  skip: { alignSelf: 'flex-end', marginBottom: 24 },
  skipText: { color: '#94A3B8', fontSize: 14 },
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
  nav: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 32 },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  navButtonPrimary: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  navButtonText: { color: '#94A3B8', fontWeight: '600', fontSize: 15 },
  navButtonTextPrimary: { color: '#FFFFFF' },
});
