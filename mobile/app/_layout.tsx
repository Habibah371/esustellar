import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Slot, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { AnnouncementBanner } from '../components/announcements/AnnouncementBanner';
import { NotificationBanner } from '../components/notifications/NotificationBanner';
import { loadLanguage } from '../constants/i18n';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useAutoLock } from '../hooks/useAutoLock';
import i18n from '../i18n';
import { getRouteFromNotificationData } from '../services/notifications/notificationRouting';
import { queryClient } from '../services/queryClient';
import { biometricService } from '../services/security';
import { logger } from '../services/logger';
import { registerBackgroundSyncScheduler } from '../services/sync/scheduler';

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

    const result = await biometricService.authenticate(
      t('lock.biometricPrompt', { appName: t('common.appName') }),
      true,
    );

    if (result.success) {
      setLocked(false);
    }
  }, [t]);

  const openPinFallback = useCallback(() => {
    setLocked(false);
    router.push('/security/enter-pin?reason=biometric-fallback');
  }, [router]);

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
          const enabled = await AsyncStorage.getItem(BIOMETRIC_LOCK_KEY);

          if (enabled === 'true') {
            setLocked(true);
            setMasked(false);
            await promptBiometric();
          } else {
            setMasked(false);
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

      // Register background sync scheduler (#299)
      registerBackgroundSyncScheduler().catch((err) =>
        logger.warn('RootLayout', 'Background sync registration failed', err),
      );

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

    return () => {
      active = false;
    };
  }, [router]);

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

  const showBanner = useCallback(
    (notification: Notifications.Notification) => {
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
    },
    [t],
  );

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
          <Text style={styles.overlayText}>{t('common.appName')}</Text>
        </View>
      )}

      {locked && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>{t('common.appName')}</Text>
          <Text style={styles.lockHint} onPress={promptBiometric}>
            {t('lock.tapToUnlock')}
          </Text>
          <Pressable style={styles.lockButton} onPress={openPinFallback}>
            <Text style={styles.lockButtonText}>Use PIN</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <RootLayoutContent />
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
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
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  lockHint: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
});
