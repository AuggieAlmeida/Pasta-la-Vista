import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAuthStore } from '../stores/auth.store';

interface SplashScreenProps {
  navigation: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const checkAuthStatus = async (): Promise<void> => {
      // Simular verificação de token
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (!isAuthenticated || !user) {
        // Usuário não autenticado - ir para login
        navigation.replace('Login');
      }
    };

    checkAuthStatus();
  }, [isAuthenticated, user, navigation]);

  return (
    <View style={styles.container}>
      <FontAwesome6 name="bowl-food" size={80} color="#FF6B35" style={styles.logo} />
      <Text style={styles.title}>Pasta la vista</Text>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={styles.version}>v0.6.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 32,
  },
  version: {
    fontSize: 12,
    color: '#999',
    marginTop: 32,
  },
});
