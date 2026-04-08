import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../stores/auth.store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Home (Cliente)</Text>
    <Text style={styles.subtitle}>Sprint 2: Menu e Carrinho</Text>
  </View>
);

const OrdersScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Meus Pedidos</Text>
    <Text style={styles.subtitle}>Sprint 2: Histórico de pedidos</Text>
  </View>
);

const ProfileScreen = () => {
  const { clearAuth, user } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.userInfo}>{user?.name}</Text>
      <Text style={styles.userInfo}>{user?.email}</Text>
      
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => clearAuth()}
      >
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
};

export const ClientNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Cardápio',
          tabBarLabel: 'Cardápio',
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'Pedidos',
          tabBarLabel: 'Pedidos',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  logoutButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
