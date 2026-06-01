
export type Environment = 'development' | 'staging' | 'production';

interface AppConfig {
  ENV: Environment;
  API_URL: string;
  IS_PRODUCTION: boolean;
}

// 1. Separate Configurations per Environment
const configs: Record<Environment, AppConfig> = {
  development: {
    ENV: 'development',
    API_URL: process.env.EXPO_PUBLIC_DEV_API_URL || 'https://api-dev.esustellar.com',
    IS_PRODUCTION: false,
  },
  staging: {
    ENV: 'staging',
    API_URL: process.env.EXPO_PUBLIC_STAGE_API_URL || 'https://api-staging.esustellar.com',
    IS_PRODUCTION: false,
  },
  production: {
    ENV: 'production',
    API_URL: process.env.EXPO_PUBLIC_PROD_API_URL || 'https://api.esustellar.com',
    IS_PRODUCTION: true,
  },
};

// 2. Identify Current Active Environment Safely
const currentEnv: Environment = (process.env.EXPO_PUBLIC_APP_VARIANT as Environment) || 'development';

// 3. Environment Variable Validation Check
const config = configs[currentEnv];
if (!config.API_URL) {
  throw new Error(`[Env Configuration Error]: Missing API URL configuration for environment: ${currentEnv}`);
}

export const env = config;