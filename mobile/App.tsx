import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

export default function App(): JSX.Element {
  useEffect(() => {
    async function prepare(): Promise<void> {
      try {
        // Simular carregamento de assets
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.error(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return <RootNavigator />;
}
