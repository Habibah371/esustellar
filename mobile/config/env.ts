/**
 * Centralised, validated application configuration.
 *
 * All values come from `EXPO_PUBLIC_*` environment variables so they are
 * inlined at build time by Expo's bundler and safe to read on the client.
 *
 * Environment files (loaded in priority order by Expo):
 *   .env.local          – local overrides (git-ignored)
 *   .env.<environment>  – e.g. .env.development / .env.staging / .env.production
 *   .env               – shared defaults
 *
 * Switch environments by setting APP_VARIANT in eas.json or via:
 *   npx expo start --env staging
 */

type Environment = 'development' | 'staging' | 'production';

interface AppConfig {
  /** Current runtime environment. */
  env: Environment;
  /** Base URL for the EsuStellar REST API. */
  apiUrl: string;
  /** Stellar network name ('testnet' | 'mainnet'). */
  stellarNetwork: string;
  /** Horizon server base URL. */
  stellarHorizonUrl: string;
  /** Stellar network passphrase used when signing transactions. */
  stellarNetworkPassphrase: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[config] Missing required environment variable: ${key}. ` +
        'Copy .env.example to .env.local and fill in the values.',
    );
  }
  return value;
}

function validateUrl(value: string, key: string): string {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return value;
  } catch {
    throw new Error(`[config] ${key} must be a valid URL. Received: "${value}"`);
  }
}

function validateNetwork(value: string): string {
  if (value === 'testnet' || value === 'mainnet') {
    return value;
  }

  throw new Error(
    `[config] EXPO_PUBLIC_STELLAR_NETWORK must be "testnet" or "mainnet". Received: "${value}"`,
  );
}

function parseEnvironment(raw: string | undefined): Environment {
  if (raw === 'staging' || raw === 'production') return raw;
  if (raw === 'development') return raw;
  return 'development';
}

export function resolveEnvironment(
  expoPublicEnv: string | undefined,
  nodeEnv: string | undefined,
): Environment {
  return parseEnvironment(expoPublicEnv ?? nodeEnv);
}

const config: AppConfig = {
  env: resolveEnvironment(process.env.EXPO_PUBLIC_ENV, process.env.NODE_ENV),
  apiUrl: validateUrl(requireEnv('EXPO_PUBLIC_API_URL'), 'EXPO_PUBLIC_API_URL'),
  stellarNetwork: validateNetwork(requireEnv('EXPO_PUBLIC_STELLAR_NETWORK')),
  stellarHorizonUrl: validateUrl(
    requireEnv('EXPO_PUBLIC_STELLAR_HORIZON_URL'),
    'EXPO_PUBLIC_STELLAR_HORIZON_URL',
  ),
  stellarNetworkPassphrase: requireEnv('EXPO_PUBLIC_STELLAR_NETWORK_PASSPHRASE'),
};

/** Returns true when running against the development environment. */
export const isDev = (): boolean => config.env === 'development';
/** Returns true when running against the staging environment. */
export const isStaging = (): boolean => config.env === 'staging';
/** Returns true when running against the production environment. */
export const isProd = (): boolean => config.env === 'production';

export default config;
