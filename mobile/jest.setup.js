// jest.setup.js

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
jest.mock('expo-haptics', () => require('./__mocks__/expo-haptics.js'));

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
