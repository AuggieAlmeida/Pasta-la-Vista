import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

export const StripeWrapper = ({ children }: { children: React.ReactNode }) => {
  const stripePk = Constants.expoConfig?.extra?.stripePk || '';
  return <StripeProvider publishableKey={stripePk}>{children}</StripeProvider>;
};
