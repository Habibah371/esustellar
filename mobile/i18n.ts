import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import sw from './locales/sw.json';

export const SUPPORTED_LANGUAGES = ['ar', 'en', 'fr', 'sw'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const LANGUAGE_STORAGE_KEY = 'esustellar_app_language';

export const languageOptions: ReadonlyArray<{
  label: string;
  value: SupportedLanguage;
}> = [
  { label: 'العربية', value: 'ar' },
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
  { label: 'Kiswahili', value: 'sw' },
];

const RTL_LANGUAGES: ReadonlyArray<SupportedLanguage> = ['ar'];

export const resources = {
  ar: { translation: ar },
  en: { translation: en },
  fr: { translation: fr },
  sw: { translation: sw },
} as const;

const localeToLanguage = (locale?: string | null): SupportedLanguage => {
  if (!locale) {
    return 'en';
  }

  const languageCode = locale.split('-')[0]?.toLowerCase();
  return SUPPORTED_LANGUAGES.some(
    (supportedLanguage) => supportedLanguage === languageCode,
  )
    ? (languageCode as SupportedLanguage)
    : 'en';
};

export const resolveDeviceLanguage = (): SupportedLanguage => {
  const primaryLocale = Localization.getLocales()[0];

  return localeToLanguage(
    primaryLocale?.languageCode ?? primaryLocale?.languageTag ?? 'en',
  );
};

export const applyRTL = (language: SupportedLanguage): void => {
  const shouldBeRTL = RTL_LANGUAGES.some(
    (rtlLanguage) => rtlLanguage === language,
  );

  I18nManager.allowRTL(true);

  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
  }
};

if (!i18n.isInitialized) {
  const initialLanguage = resolveDeviceLanguage();
  applyRTL(initialLanguage);

  void i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    defaultNS: 'translation',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    lng: initialLanguage,
    react: {
      useSuspense: false,
    },
    resources,
    returnNull: false,
    supportedLngs: [...SUPPORTED_LANGUAGES],
  });
}

export default i18n;
