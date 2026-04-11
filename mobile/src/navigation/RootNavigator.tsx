import React, { useEffect, useState, useMemo } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../stores/auth.store';
import { AuthNavigator } from './AuthNavigator';
import { ClientNavigator } from './ClientNavigator';
import { AdminNavigator } from './AdminNavigator';

export const RootNavigator: React.FC = () => {
  const [isStoreReady, setIsStoreReady] = useState(false);
  
  const { isAuthenticated, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));

  useEffect(() => {
    // Extra delay to ensure store is fully hydrated
    const timer = setTimeout(() => {
      setIsStoreReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const navigationContent = useMemo(() => {
    try {
      if (!isAuthenticated || !user) {
        return <AuthNavigator />;
      }
      
      if (user.role === 'ADMIN') {
        return <AdminNavigator />;
      }
      
      return <ClientNavigator />;
    } catch (error) {
      console.error('Error rendering navigation:', error);
      return <AuthNavigator />;
    }
  }, [isAuthenticated, user]);

  // Don't render navigation until store is ready
  if (!isStoreReady) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return (
    <NavigationContainer
      fallback={<View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />}
    >
      {navigationContent}
    </NavigationContainer>
  );
};
