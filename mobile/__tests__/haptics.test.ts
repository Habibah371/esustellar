import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  getHapticsEnabled,
  setHapticsEnabled,
  triggerHapticFeedback,
  HAPTICS_ENABLED_STORAGE_KEY,
} from '@/services/haptics';

describe('haptics service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await setHapticsEnabled(true);
  });

  it('defaults to enabled when no preference is stored', async () => {
    await AsyncStorage.removeItem(HAPTICS_ENABLED_STORAGE_KEY);
    expect(await getHapticsEnabled()).toBe(true);
  });

  it('persists disabled preference', async () => {
    await setHapticsEnabled(false);

    expect(await AsyncStorage.getItem(HAPTICS_ENABLED_STORAGE_KEY)).toBe('false');
    expect(await getHapticsEnabled()).toBe(false);
  });

  it('triggers light feedback when enabled', async () => {
    await setHapticsEnabled(true);

    await triggerHapticFeedback.light();

    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Light,
    );
  });

  it('does not trigger feedback when disabled', async () => {
    await setHapticsEnabled(false);

    await triggerHapticFeedback.success();

    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});
