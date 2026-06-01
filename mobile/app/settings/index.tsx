import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

import Button from '../../components/ui/Button';
import WalletSwitcher from '../../components/wallet/WalletSwitcher';

import {
  biometricService,
  BiometricCapability,
  BiometricType,
  SecurityStatus,
} from '../../services/security';

import { pinService } from '../../services/security/pinService';

import {
  getSecurityPreferences,
  saveSecurityPreferences,
  SecurityPreferences,
} from '../../services/security/securityPreferences';

import {
  getAutoLockTimeout,
  setAutoLockTimeout as persistAutoLockTimeout,
  AUTO_LOCK_OPTIONS,
} from '../../hooks/useAutoLock';

import {
  getLanguage,
  languageOptions,
  loadLanguage,
} from '../../constants/i18n';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { getActiveWallet, WalletEntry } from '../../services/wallet/multiWallet';
import * as Clipboard from 'expo-clipboard';
import {
  loadHapticsPreference,
  setHapticsEnabled as persistHapticsEnabled,
  triggerHapticFeedback,
} from '../../services/haptics';
import { getJSEngine } from '../../utils/hermes';

const BIOMETRIC_LOCK_KEY = 'biometricLockEnabled';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme, colors, resolvedColorScheme, setColorScheme } =
    useTheme();

  const [biometricCap, setBiometricCap] = useState<BiometricCapability>({
    status: SecurityStatus.UNKNOWN,
    supportedTypes: [],
  });

  const [securityPreferences, setSecurityPreferences] =
    useState<SecurityPreferences>({
      biometricEnabled: false,
      pinEnabled: false,
    });

  const [biometricEnabledLocal, setBiometricEnabledLocal] = useState(false);
  const [autoLockTimeout, setAutoLockTimeout] = useState(300);

  const [pinSet, setPinSet] = useState(false);
  const [pinLockoutRemainingMs, setPinLockoutRemainingMs] = useState(0);
  const [activeWallet, setActiveWallet] = useState<WalletEntry | null>(null);
  const [walletSwitcherVisible, setWalletSwitcherVisible] = useState(false);

  const [language, setLanguage] = useState(getLanguage());
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const setWallet = useAuthStore((state) => state.setWallet);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Load everything ─────────────────────────────────────────

  const loadSecurityState = useCallback(() => {
    let active = true;

    void (async () => {
      const [
        cap,
        prefs,
        pinStatus,
        storedLang,
        storedToggle,
        storedHaptics,
        activeWalletEntry,
        storedAutoLock,
      ] = await Promise.all([
        biometricService.getCapability(),
        getSecurityPreferences(),
        pinService.getStatus(),
        loadLanguage(),
        AsyncStorage.getItem(BIOMETRIC_LOCK_KEY),
        loadHapticsPreference(),
        getActiveWallet(),
        getAutoLockTimeout(),
      ]);

      if (!active) return;

      setBiometricCap(cap);
      setSecurityPreferences(prefs);
      setPinSet(pinStatus.isPinSet);
      setPinLockoutRemainingMs(pinStatus.remainingLockoutMs);
      setLanguage(storedLang);
      setBiometricEnabledLocal(storedToggle === 'true');
      setHapticsEnabledState(storedHaptics);
      setAutoLockTimeout(storedAutoLock);
      setActiveWallet(activeWalletEntry);

      if (activeWalletEntry) {
        setWallet({
          publicKey: activeWalletEntry.publicKey,
          walletType: 'multiWallet',
        });
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [setWallet]);

  useFocusEffect(loadSecurityState);

  // ── Labels ─────────────────────────────────────────

  const truncateKey = (key: string) => {
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  };

  const supportedLabel = useMemo(() => {
    if (
      biometricCap.supportedTypes.length === 0 ||
      biometricCap.supportedTypes.some((type) => type === BiometricType.NONE)
    ) {
      return 'Unavailable';
    }

    return biometricCap.supportedTypes
      .map((type) => {
        switch (type) {
          case BiometricType.FINGERPRINT:
            return 'Fingerprint';
          case BiometricType.FACIAL_RECOGNITION:
            return 'Face ID';
          case BiometricType.IRIS:
            return 'Iris';
          default:
            return 'Biometrics';
        }
      })
      .join(' / ');
  }, [biometricCap]);

  // ── Biometric (API-based) ─────────────────────────

  const handleBiometricToggle = async () => {
    if (biometricCap.status !== SecurityStatus.AVAILABLE) {
      void triggerHapticFeedback.warning();
      Alert.alert('Unavailable', 'Set up biometrics first.');
      return;
    }

    setAuthenticating(true);

    const result = await biometricService.authenticate(
      securityPreferences.biometricEnabled
        ? 'Disable biometrics'
        : 'Enable biometrics',
    );

    setAuthenticating(false);

    if (!result.success) {
      void triggerHapticFeedback.error();
      setMessage(result.error ?? 'Failed');
      return;
    }

    const next = await saveSecurityPreferences({
      biometricEnabled: !securityPreferences.biometricEnabled,
    });

    void triggerHapticFeedback.success();
    setSecurityPreferences(next);
  };

  // ── Simple biometric lock (AsyncStorage) ───────────

  const handleLocalToggle = async (value: boolean) => {
    if (value) {
      if (biometricCap.status !== SecurityStatus.AVAILABLE) {
        Alert.alert('Unavailable', 'Set up biometrics first.');
        return;
      }

      const result = await biometricService.authenticate('Enable lock');
      if (!result.success) {
        void triggerHapticFeedback.error();
        return;
      }
    }

    setBiometricEnabledLocal(value);
    await AsyncStorage.setItem(BIOMETRIC_LOCK_KEY, value ? 'true' : 'false');
    void triggerHapticFeedback.selection();
  };

  const handleHapticsToggle = async (value: boolean) => {
    await persistHapticsEnabled(value);
    setHapticsEnabledState(value);

    if (value) {
      void triggerHapticFeedback.selection();
    }
  };

  // ── PIN ───────────────────────────────────────────

  const handleRemovePin = () => {
    Alert.alert('Remove PIN', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await pinService.removePin();
          const next = await saveSecurityPreferences({ pinEnabled: false });

          void triggerHapticFeedback.success();
          setSecurityPreferences(next);
          setPinSet(false);
        },
      },
    ]);
  };

  // ── Wallet copy ───────────────────────────────────

  const handleCopy = async () => {
    if (!activeWallet?.publicKey) {
      void triggerHapticFeedback.error();
      setMessage('No active wallet available');
      return;
    }

    try {
      await Clipboard.setStringAsync(activeWallet.publicKey);
      void triggerHapticFeedback.success();
      setMessage('Copied');
    } catch {
      void triggerHapticFeedback.error();
      setMessage('Failed to copy');
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.text }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Wallet */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Wallet</Text>
          {activeWallet ? (
            <>
              <Text style={[styles.valueText, { color: colors.text }]}>
                {activeWallet.label}
              </Text>
              <Text style={[styles.helperText, { color: colors.subtext }]}> 
                {truncateKey(activeWallet.publicKey)}
              </Text>
            </>
          ) : (
            <Text style={[styles.helperText, { color: colors.subtext }]}>No active wallet selected.</Text>
          )}

          <View style={styles.walletActions}>
            <Button onPress={() => setWalletSwitcherVisible(true)}>
              Manage wallets
            </Button>
            <Button variant="outline" onPress={() => router.push('/wallet/add')}>
              Add wallet
            </Button>
          </View>

          <Button onPress={handleCopy} disabled={!activeWallet}>
            Copy address
          </Button>
        </View>

        {/* Language */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.language')}
          </Text>
          <Button onPress={() => router.push('/settings/language')}>
            {languageOptions.find((o) => o.value === language)?.label ??
              language.toUpperCase()}
          </Button>
        </View>

        {/* Appearance */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Appearance
          </Text>
          <View style={styles.row}>
            {(['dark', 'light', 'system'] as const).map((option) => {
              const selected = colorScheme === option;
              const label =
                option === 'dark'
                  ? 'Dark'
                  : option === 'light'
                    ? 'Light'
                    : 'System';

              return (
                <Pressable
                  key={option}
                  onPress={() => setColorScheme(option)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selected ? colors.accent : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: selected ? '#FFFFFF' : colors.text }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.helperText, { color: colors.subtext }]}>
            Active mode: {resolvedColorScheme}
          </Text>
        </View>

        {/* Haptics */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.haptics')}
          </Text>
          <Text style={[styles.helperText, { color: colors.subtext }]}>
            {t('settings.hapticsDescription')}
          </Text>
          <Switch value={hapticsEnabled} onValueChange={handleHapticsToggle} />
        </View>

        {/* Biometrics */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Biometric Authentication
          </Text>
          <Text style={[styles.helperText, { color: colors.subtext }]}>
            Supported: {supportedLabel}
          </Text>

          <Button onPress={handleBiometricToggle} disabled={authenticating}>
            {securityPreferences.biometricEnabled ? 'Disable' : 'Enable'}
          </Button>
        </View>

        {/* Biometric Lock */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Use Biometric Lock
          </Text>
          <Text style={[styles.helperText, { color: colors.subtext }]}>
            Protect the app when it returns from the background.
          </Text>
          <Switch
            value={biometricEnabledLocal}
            onValueChange={handleLocalToggle}
            disabled={biometricCap.status !== SecurityStatus.AVAILABLE}
          />
        </View>

        {/* PIN */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>PIN</Text>

          {pinSet ? (
            <>
              <Button
                onPress={() => router.push('/security/enter-pin?mode=change')}
              >
                Change PIN
              </Button>
              <Button onPress={handleRemovePin}>Remove PIN</Button>
            </>
          ) : (
            <Button onPress={() => router.push('/security/setup-pin')}>
              Set PIN
            </Button>
          )}

          {pinLockoutRemainingMs > 0 && (
            <Text style={[styles.helperText, { color: colors.subtext }]}>
              Locked for {Math.ceil(pinLockoutRemainingMs / 1000)}s
            </Text>
          )}
        </View>

        <WalletSwitcher
          visible={walletSwitcherVisible}
          onClose={() => setWalletSwitcherVisible(false)}
          onWalletChanged={(wallet) => {
            setActiveWallet(wallet);
            setWallet({ publicKey: wallet.publicKey, walletType: 'multiWallet' });
          }}
          onAddWallet={() => {
            setWalletSwitcherVisible(false);
            router.push('/wallet/add');
          }}
        />

        {/* Wallet Recovery */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Wallet Recovery
          </Text>
          <Text style={[styles.helperText, { color: colors.subtext }]}>
            Review backup instructions and recovery safety checks.
          </Text>
          <Button onPress={() => router.push('/wallet/recovery')}>
            Open Recovery Options
          </Button>
        </View>

        {/* Auto-lock */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Auto-lock after
          </Text>
          <View style={styles.row}>
            {AUTO_LOCK_OPTIONS.map((option) => {
              const selected = autoLockTimeout === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={async () => {
                    setAutoLockTimeout(option.value);
                    await persistAutoLockTimeout(option.value);
                    void triggerHapticFeedback.selection();
                  }}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selected ? colors.accent : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: selected ? '#FFFFFF' : colors.text }}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* About */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Legal
          </Text>
          <Button onPress={() => router.push('/legal/terms')}>
            Terms of Service
          </Button>
          <Button onPress={() => router.push('/legal/privacy')}>
            Privacy Policy
          </Button>
        </View>

        {/* Version */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.helperText, { color: colors.subtext }]}>
            Version: {Constants.expoConfig?.version}
          </Text>
          <Text style={[styles.helperText, { color: colors.subtext }]}>
            JS Engine: {getJSEngine()}
          </Text>
        </View>

        {message && <Text style={{ color: colors.text }}>{message}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 14,
  },
  helperText: {
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  walletActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

