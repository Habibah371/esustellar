import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Slot, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NotificationBanner } from '../components/notifications/NotificationBanner';
import { AnnouncementBanner } from '../components/announcements/AnnouncementBanner';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useAutoLock } from '../hooks/useAutoLock';
import { loadLanguage } from '../constants/i18n';
import { getRouteFromNotificationData } from '../services/notifications/notificationRouting';
import { biometricService } from '../services/security';
import { logger } from '../utils/logger';

const ONBOARDING_KEY = 'onboardingComplete';
const BIOMETRIC_LOCK_KEY = 'biometricLockEnabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
  }),
});

function RootLayoutContent() {
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [checking, setChecking] = useState(true);
  const [banner, setBanner] = useState<{
    body?: string;
    data?: Record<string, unknown>;
    title: string;
  } | null>(null);
  const [masked, setMasked] = useState(false);
  const [locked, setLocked] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const promptBiometric = useCallback(async () => {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_LOCK_KEY);

    if (enabled !== 'true') {
      return;
    }

    const result = await biometricService.authenticate('Unlock EsuStellar');

    if (result.success) {
      setLocked(false);
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        const prev = appState.current;
        appState.current = nextState;

        if (nextState === 'background' || nextState === 'inactive') {
          setMasked(true);
        }

        if (
          nextState === 'active' &&
          (prev === 'background' || prev === 'inactive')
        ) {
          setMasked(false);
          const enabled = await AsyncStorage.getItem(BIOMETRIC_LOCK_KEY);

          if (enabled === 'true') {
            setLocked(true);
            await promptBiometric();
          }
        }
      },
    );

    return () => subscription.remove();
  }, [promptBiometric]);

  useAutoLock(() => {
    router.replace('/wallet/connect');
  });

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      await loadLanguage();
      logger.info('RootLayout', 'App initializing');

      const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_KEY);

      if (!active) {
        return;
      }

      router.replace(
        onboardingComplete === 'true' ? '/wallet/connect' : '/onboarding',
      );
      setChecking(false);
    };

    void initialize();

    initialize();
  }, [router]);

  // ── Notifications ───────────────────────────────────────────────────────

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    setBanner(null);
  }, []);

  const navigateFromNotification = useCallback(
    (data?: Record<string, unknown>) => {
      dismissBanner();
      const route = getRouteFromNotificationData(data);
      if (route) {
        router.push(route as any);
      }
    },
    [dismissBanner, router],
  );

  const showBanner = useCallback((notification: Notifications.Notification) => {
    const content = notification.request.content;

    setBanner({
      body: content.body ?? undefined,
      data: (content.data ?? {}) as Record<string, unknown>,
      title: content.title ?? t('tabs.notifications'),
    });

    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }

    bannerTimerRef.current = setTimeout(() => {
      setBanner(null);
      bannerTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        showBanner(notification);
      },
    );
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        navigateFromNotification(
          response.notification.request.content.data as Record<string, unknown>,
        );
      });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      navigateFromNotification(
        response.notification.request.content.data as Record<string, unknown>,
      );
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, [navigateFromNotification, showBanner]);

  if (checking) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Slot />

      <AnnouncementBanner />
      <NotificationBanner
        body={banner?.body}
        title={banner?.title ?? ''}
        visible={Boolean(banner)}
        onDismiss={dismissBanner}
        onPress={() => navigateFromNotification(banner?.data)}
      />

      {masked && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayText}>EsuStellar</Text>
        </View>
      )}

      {locked && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>EsuStellar</Text>
          <Text style={styles.lockHint} onPress={promptBiometric}>
            {t('lock.tapToUnlock')}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
  lockHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    marginTop: 16,
  },
});
