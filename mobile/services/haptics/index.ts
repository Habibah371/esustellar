import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const HAPTICS_ENABLED_STORAGE_KEY = 'esustellar_haptics_enabled';

let cachedHapticsEnabled: boolean | null = null;

type ImpactLevel = 'light' | 'medium' | 'heavy';

const isSupportedPlatform = (): boolean => Platform.OS !== 'web';

function runImpact(level: ImpactLevel) {
  if (!isSupportedPlatform()) return;

  const styleMap = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };

  return runHaptic(() => Haptics.impactAsync(styleMap[level]));
}

function runNotification(type: Haptics.NotificationFeedbackType) {
  if (!isSupportedPlatform()) return;
  return runHaptic(() => Haptics.notificationAsync(type));
}

export const getHapticsEnabled = async (): Promise<boolean> => {
  if (cachedHapticsEnabled !== null) {
    return cachedHapticsEnabled;
  }

  try {
    const storedValue = await AsyncStorage.getItem(HAPTICS_ENABLED_STORAGE_KEY);
    cachedHapticsEnabled = storedValue !== 'false';
    return cachedHapticsEnabled;
  } catch {
    cachedHapticsEnabled = true;
    return true;
  }
};

export const loadHapticsPreference = getHapticsEnabled;

export const setHapticsEnabled = async (enabled: boolean): Promise<void> => {
  cachedHapticsEnabled = enabled;

  try {
    await AsyncStorage.setItem(
      HAPTICS_ENABLED_STORAGE_KEY,
      enabled ? 'true' : 'false',
    );
  } catch {
    // Ignore persistence failures and keep the in-memory preference.
  }
};

const runHaptic = async (callback: () => Promise<unknown>): Promise<void> => {
  if (!isSupportedPlatform()) {
    return;
  }

  const enabled = await getHapticsEnabled();
  if (!enabled) {
    return;
  }

  try {
    await callback();
  } catch {
    // Silently fail on unsupported devices or simulators.
  }
};

export const triggerHapticFeedback = {
  light: () => runImpact('light'),
  medium: () => runImpact('medium'),
  heavy: () => runImpact('heavy'),
  selection: () => {
    if (!isSupportedPlatform()) return;
    return runHaptic(() => Haptics.selectionAsync());
  },
  success: () => runNotification(Haptics.NotificationFeedbackType.Success),
  warning: () => runNotification(Haptics.NotificationFeedbackType.Warning),
  error: () => runNotification(Haptics.NotificationFeedbackType.Error),
};
