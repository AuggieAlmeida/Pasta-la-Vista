import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../stores/auth.store';
import { AuthNavigator } from './AuthNavigator';
import { ClientNavigator } from './ClientNavigator';
import { AdminNavigator } from './AdminNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <NavigationContainer>
      {!isAuthenticated || !user ? (
        <AuthNavigator />
      ) : user.role === 'ADMIN' ? (
        <AdminNavigator />
      ) : (
        <ClientNavigator />
      )}
    </NavigationContainer>
  );
};
