import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';

import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import es from '../../locales/es.json';
import fr from '../../locales/fr.json';
import sw from '../../locales/sw.json';

export type SupportedLanguage = 'ar' | 'en' | 'es' | 'fr' | 'sw';
export const LANGUAGE_STORAGE_KEY = 'esustellar_app_language';

/** Languages written right-to-left. */
const RTL_LANGUAGES: ReadonlySet<SupportedLanguage> = new Set<SupportedLanguage>(['ar']);

export const languageOptions = [
  { label: 'العربية', value: 'ar' as SupportedLanguage },
  { label: 'English', value: 'en' as SupportedLanguage },
  { label: 'Español', value: 'es' as SupportedLanguage },
  { label: 'Français', value: 'fr' as SupportedLanguage },
  { label: 'Kiswahili', value: 'sw' as SupportedLanguage },
];

const applyRTL = (lang: SupportedLanguage): void => {
  const shouldBeRTL = RTL_LANGUAGES.has(lang);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
  }
};

const resources = {
  ar: { translation: ar },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  sw: { translation: sw },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

const getDeviceLanguage = (): SupportedLanguage => {
  const locale = Localization.locale || 'en';
  const languageTag = locale.split('-')[0] as SupportedLanguage;
  return languageOptions.some((item) => item.value === languageTag) ? languageTag : 'en';
};

export const getLanguage = (): SupportedLanguage => {
  const currentLanguage = i18n.language as SupportedLanguage;
  return languageOptions.some((item) => item.value === currentLanguage) ? currentLanguage : 'en';
};

export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  applyRTL(language);
  await i18n.changeLanguage(language);
};

export const loadLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const language =
      stored && languageOptions.some((item) => item.value === stored)
        ? (stored as SupportedLanguage)
        : getDeviceLanguage();

    await i18n.changeLanguage(language);
    applyRTL(language);
    return language;
  } catch {
    await i18n.changeLanguage('en');
    applyRTL('en');
    return 'en';
  }
};

export default i18n;
