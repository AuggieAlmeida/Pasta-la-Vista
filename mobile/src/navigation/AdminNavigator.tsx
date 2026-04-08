import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../stores/auth.store';

const Drawer = createDrawerNavigator();

const DashboardScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Dashboard Admin</Text>
    <Text style={styles.subtitle}>Sprint 3: Gestão de pedidos e estoque</Text>
  </View>
);

const StockScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Estoque</Text>
    <Text style={styles.subtitle}>Sprint 3: Kanban de produtos</Text>
  </View>
);

const AdminProfileScreen = () => {
  const { clearAuth, user } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil Admin</Text>
      <Text style={styles.userInfo}>{user?.name}</Text>
      <Text style={styles.userInfo}>{user?.email}</Text>
      <Text style={styles.userInfo}>(Administrador)</Text>
      
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => clearAuth()}
      >
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
};

export const AdminNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerLabelStyle: { fontSize: 14 },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          drawerLabel: 'Dashboard',
        }}
      />
      <Drawer.Screen
        name="Stock"
        component={StockScreen}
        options={{
          title: 'Estoque',
          drawerLabel: 'Estoque',
        }}
      />
      <Drawer.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          title: 'Perfil',
          drawerLabel: 'Perfil',
        }}
      />
    </Drawer.Navigator>
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
