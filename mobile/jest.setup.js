// jest.setup.js

// Provide required environment variables so config/env.ts does not throw on import
process.env.EXPO_PUBLIC_API_URL = 'https://api.esustellar.test';
process.env.EXPO_PUBLIC_STELLAR_NETWORK = 'testnet';
process.env.EXPO_PUBLIC_STELLAR_HORIZON_URL = 'https://horizon-testnet.stellar.org';
process.env.EXPO_PUBLIC_STELLAR_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytes: jest.fn((size) => new Uint8Array(size)),
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock expo-localization with a valid locale
jest.mock('expo-localization', () => ({
  locale: 'en-US',
  locales: [{ languageTag: 'en-US' }],
  getLocales: () => [{ languageTag: 'en-US', languageCode: 'en', regionCode: 'US', currencyCode: 'USD', currencySymbol: '$', decimalSeparator: '.', digitGroupingSeparator: ',' }],
}));

// Mock expo-image
jest.mock('expo-image', () => {
  const React = require('react');
  const { Image } = require('react-native');
  return {
    Image: React.forwardRef((props, ref) => {
      return React.createElement(Image, {
        ...props,
        ref,
        accessibilityRole: 'image',
        accessible: true,
      });
    }),
  };
});
