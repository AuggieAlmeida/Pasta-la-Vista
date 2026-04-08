import { ExpoConfig, getDefaultConfig } from 'expo/config';

const config = getDefaultConfig(__dirname);

const expoConfig: ExpoConfig = {
  ...config,
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3333',
    stripePk: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
};

export default expoConfig;
