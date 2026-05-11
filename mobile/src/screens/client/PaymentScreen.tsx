import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Web stub – @stripe/stripe-react-native is native-only.
 * On web this screen renders a friendly "not available" message.
 */
export const PaymentScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.emoji}>💳</Text>
    <Text style={styles.title}>Pagamento indisponível na web</Text>
    <Text style={styles.subtitle}>
      Use o aplicativo no celular para realizar pagamentos com cartão.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
