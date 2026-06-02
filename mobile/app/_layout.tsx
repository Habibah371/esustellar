import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Slot, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Platform,
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
import { useAutoLock, recordInteraction } from '../hooks/useAutoLock';
import { silentNotificationHandler } from '../services/notifications/silent';
import i18n from '../i18n';
import { getRouteFromNotificationData } from '../services/notifications/notificationRouting';
import { queryClient } from '../services/queryClient';
import { biometricService } from '../services/security';
import { registerAppUnlockHandler } from '../services/security/appLock';
import { pinService } from '../services/security/pinService';
import { logger } from '../services/logger';
import { runAfterInteractions } from '../services/performance/interactionManager';
import { registerBackgroundSyncScheduler } from '../services/sync/scheduler';
import { useAuthStore } from '../store/authStore';
import { getActiveWallet } from '../services/wallet/multiWallet';

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

  // `withTimeout` has no dependencies — use an empty dep array so the ref is
  // created once and never triggers downstream re-renders.
  const withTimeout = useCallback(<T,>(promise: Promise<T>, label: string, timeoutMs = 3000) => {
    return Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        const timeoutId = setTimeout(() => {
          clearTimeout(timeoutId);
          reject(new Error(`${label} timed out`));
        }, timeoutMs);
      }),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlockApp = useCallback(async () => {
    const biometricEnabled =
      (await AsyncStorage.getItem(BIOMETRIC_LOCK_KEY)) === 'true';
    const { isPinSet } = await pinService.getStatus();

    if (biometricEnabled) {
      const result = await biometricService.authenticate(
        t('lock.biometricPrompt', { appName: t('common.appName') }),
        true,
      );

      if (result.success) {
        setLocked(false);
        recordInteraction();
        return;
      }

      if (isPinSet) {
        router.push('/security/enter-pin?reason=biometric-fallback');
      }
      return;
    }

    if (isPinSet) {
      router.push('/security/enter-pin?reason=auto-lock');
      return;
    }

    setLocked(false);
    recordInteraction();
  }, [router, t]);

  useEffect(() => {
    return registerAppUnlockHandler(() => {
      setLocked(false);
      recordInteraction();
    });
  }, []);

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
            await unlockApp();
          } else {
            setMasked(false);
          }
        }
      },
    );

    return () => subscription.remove();
  }, [unlockApp]);

  useAutoLock(() => {
    setLocked(true);
  });

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        await withTimeout(loadLanguage(), 'Language initialization');
        logger.info('RootLayout', 'App initializing');

        // Defer background sync registration until after the first render
        // and any navigation animations have finished — this avoids blocking
        // the JS thread during startup on both iOS and Android.
        runAfterInteractions(() => {
          registerBackgroundSyncScheduler().catch((err) =>
            logger.warn('RootLayout', 'Background sync registration failed', err),
          );
        }, 'background-sync-registration');

        const onboardingComplete = await withTimeout(
          AsyncStorage.getItem(ONBOARDING_KEY),
          'Onboarding check',
        );

        if (!active) {
          return;
        }

        router.replace(
          onboardingComplete === 'true' ? '/wallet/connect' : '/onboarding',
        );
      } catch (error) {
        logger.warn('RootLayout', 'Startup bootstrap failed; continuing', error);
        if (active) {
          router.replace('/onboarding');
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [router]);

  const logout = useAuthStore((state) => state.logout);
  const authWallet = useAuthStore((state) => state.wallet);
  const setAuthWallet = useAuthStore((state) => state.setWallet);

  useEffect(() => {
    let active = true;

    void (async () => {
      const activeWallet = await getActiveWallet();

      if (!active) {
        return;
      }

      if (activeWallet) {
        if (!authWallet || authWallet.publicKey !== activeWallet.publicKey) {
          setAuthWallet({
            publicKey: activeWallet.publicKey,
            walletType: 'multiWallet',
          });
        }
      } else if (authWallet?.walletType === 'multiWallet') {
        logout();
      }
    })();

    return () => {
      active = false;
    };
  }, [authWallet, logout, setAuthWallet]);

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
        // Handle silent notifications in background without showing banner
        if (silentNotificationHandler.isSilent(notification)) {
          silentNotificationHandler.handleSilentNotification(notification).catch((error) => {
            console.error('Failed to handle silent notification:', error);
          });
        } else {
          // Show banner for regular notifications
          showBanner(notification);
        }
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
      {/* Record any touch on the root so the auto-lock timer resets. */}
      <View
        style={styles.interactionCapture}
        onStartShouldSetResponder={() => {
          recordInteraction();
          // Return false so the event continues to children normally.
          return false;
        }}
      >
        <AnnouncementBanner />
        <Slot />
      </View>

      <NotificationBanner
        body={banner?.body}
        title={banner?.title ?? ''}
        visible={Boolean(banner)}
        onDismiss={dismissBanner}
        onPress={() => navigateFromNotification(banner?.data)}
      />

      {masked && (
        <View
          style={styles.overlay}
          pointerEvents="none"
          // Android: own compositor layer so the privacy overlay
          // composites without affecting the main render tree.
          {...(Platform.OS === 'android' ? { collapsable: false } : {})}
        >
          <Text style={styles.overlayText}>{t('common.appName')}</Text>
        </View>
      )}

      {locked && (
        <View
          style={styles.overlay}
          {...(Platform.OS === 'android' ? { collapsable: false } : {})}
        >
          <Text style={styles.overlayText}>{t('common.appName')}</Text>
          <Text style={styles.lockHint} onPress={() => void unlockApp()}>
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
  // Fills the root but does NOT intercept touch events — children receive
  // all gestures normally; we only read the onStartShouldSetResponder signal.
  interactionCapture: {
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
    // Android: promote to its own GPU layer so the overlay composites
    // independently and doesn't trigger a full re-layout of children.
    elevation: 20,
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
  lockButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  lockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
