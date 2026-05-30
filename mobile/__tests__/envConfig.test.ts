import { resolveEnvironment } from '../config/env';

describe('resolveEnvironment', () => {
  it('prefers EXPO_PUBLIC_ENV when valid', () => {
    expect(resolveEnvironment('staging', 'production')).toBe('staging');
    expect(resolveEnvironment('production', 'development')).toBe('production');
  });

  it('falls back to NODE_ENV when EXPO_PUBLIC_ENV is missing', () => {
    expect(resolveEnvironment(undefined, 'production')).toBe('production');
    expect(resolveEnvironment(undefined, 'staging')).toBe('staging');
  });

  it('defaults to development for unknown values', () => {
    expect(resolveEnvironment('invalid', 'invalid')).toBe('development');
    expect(resolveEnvironment(undefined, undefined)).toBe('development');
  });
});
