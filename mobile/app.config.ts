import { ExpoConfig } from 'expo/config';

const expoConfig: ExpoConfig = {
  name: 'Pasta la Vista',
  slug: 'pasta-la-vista-mobile',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  plugins: [
    [
      '@stripe/stripe-react-native',
      {
        merchantIdentifier: 'com.pastalavista.mobile',
        enableApplePay: true,
      },
    ],
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3333',
    stripePk: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    eas: {
      projectId: process.env.EXPO_PROJECT_ID,
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.pastalavista.mobile',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
};

export default expoConfig;
