import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ animationEnabled: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
    </Stack.Navigator>
  );
};
