import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  hasHandledNotificationPrompt,
  markNotificationPromptHandled,
  registerForPushNotificationsAsync,
} from '../../services/notifications/notificationService';

const ONBOARDING_KEY = 'onboardingComplete';

const SLIDES = [
  {
    eyebrow: 'Welcome',
    icon: '🌍',
    title: 'Save with people you trust',
    description:
      'Bring your community savings circle on-chain without losing the familiar group experience.',
  },
  {
    eyebrow: 'Transparent',
    icon: '💸',
    title: 'Track every contribution clearly',
    description:
      'Stay on top of payouts, due dates, and group progress with simple updates in one place.',
  },
  {
    eyebrow: 'Secure',
    icon: '🔐',
    title: 'Start with confidence',
    description:
      'Connect your Stellar wallet, manage your security options, and receive helpful reminders when it matters.',
  },
];

async function completeOnboarding(router: ReturnType<typeof useRouter>) {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  router.replace('/wallet/connect');
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const slide = SLIDES[currentStep];
  const isLastStep = currentStep === SLIDES.length - 1;

  const handleSkipOnboarding = async () => {
    await completeOnboarding(router);
  };

  const handleNext = async () => {
    if (!isLastStep) {
      setCurrentStep((previous) => previous + 1);
      return;
    }

    if (await hasHandledNotificationPrompt()) {
      await completeOnboarding(router);
      return;
    }

    setShowNotificationPrompt(true);
  };

  const handleAllowNotifications = async () => {
    setSubmitting(true);

    try {
      await registerForPushNotificationsAsync();
      setShowNotificationPrompt(false);
      await completeOnboarding(router);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipNotifications = async () => {
    setSubmitting(true);

    try {
      await markNotificationPromptHandled('skipped');
      setShowNotificationPrompt(false);
      await completeOnboarding(router);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      testID={`onboarding-screen-${currentStep + 1}`}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleSkipOnboarding}
          testID="onboarding-skip"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.icon}>{slide.icon}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.progressRow}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep ? styles.progressDotActive : null,
            ]}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={handleNext}
        style={styles.primaryButton}
        testID="onboarding-next"
      >
        <Text style={styles.primaryButtonText}>
          {isLastStep ? 'Get Started' : 'Next'}
        </Text>
      </Pressable>

      {isLastStep && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/legal/terms')}
          style={styles.termsLink}
        >
          <Text style={styles.termsLinkText}>
            By continuing, you agree to our Terms of Service
          </Text>
        </Pressable>
      )}

      <Modal
        animationType="slide"
        onRequestClose={() => setShowNotificationPrompt(false)}
        transparent
        visible={showNotificationPrompt}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Stay informed</Text>
            <Text style={styles.modalBody}>
              Get reminders for due dates, payouts, and group updates so you
              never miss an important moment.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={handleAllowNotifications}
              style={[
                styles.primaryButton,
                submitting ? styles.buttonDisabled : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>Allow Notifications</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={handleSkipNotifications}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 54,
    marginBottom: 24,
    textAlign: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressDot: {
    backgroundColor: '#334155',
    borderRadius: 999,
    height: 8,
    marginHorizontal: 4,
    width: 8,
  },
  progressDotActive: {
    backgroundColor: '#818CF8',
    width: 24,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  termsLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  termsLinkText: {
    color: '#818CF8',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalBody: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
