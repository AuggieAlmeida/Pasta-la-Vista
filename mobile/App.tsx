import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { View, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Suppress known warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'NativeModules.RNReanimated',
]);

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare(): Promise<void> {
      try {
        // Wait for runtime and native modules to initialize
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error preparing app:', error);
      } finally {
        setIsReady(true);
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Ignore errors hiding splash screen
        }
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return <RootNavigator />;
}

export default function App(): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppContent />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
