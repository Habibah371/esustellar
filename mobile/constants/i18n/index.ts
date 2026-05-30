import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n, {
  LANGUAGE_STORAGE_KEY,
  applyRTL,
  languageOptions,
  resolveDeviceLanguage,
  type SupportedLanguage,
} from '../../i18n';

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  languageOptions.some((option) => option.value === value);

export { LANGUAGE_STORAGE_KEY, languageOptions, type SupportedLanguage };

export const getLanguage = (): SupportedLanguage => {
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;
  return currentLanguage && isSupportedLanguage(currentLanguage)
    ? currentLanguage
    : 'en';
};

export const changeLanguage = async (
  language: SupportedLanguage,
): Promise<void> => {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  applyRTL(language);
  await i18n.changeLanguage(language);
};

export const loadLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const language =
      storedLanguage && isSupportedLanguage(storedLanguage)
        ? storedLanguage
        : resolveDeviceLanguage();

    applyRTL(language);
    await i18n.changeLanguage(language);
    return language;
  } catch {
    applyRTL('en');
    await i18n.changeLanguage('en');
    return 'en';
  }
};

export default i18n;
