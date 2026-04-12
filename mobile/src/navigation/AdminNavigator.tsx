import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../stores/auth.store';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { OrderManagementScreen } from '../screens/admin/OrderManagementScreen';
import { StockKanbanScreen } from '../screens/admin/StockKanbanScreen';
import { ProductListScreen } from '../screens/admin/ProductListScreen';
import { ProductFormScreen } from '../screens/admin/ProductFormScreen';
import { FeedbacksScreen } from '../screens/admin/FeedbacksScreen';

const Drawer = createDrawerNavigator();
const ProductStack = createNativeStackNavigator();

const ProductStackNavigator = () => {
  return (
    <ProductStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFF' },
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <ProductStack.Screen
        name="Lista"
        component={ProductListScreen}
        options={{
          headerShown: true, // O Drawer vai prover o header para esta tela
        }}
      />
      <ProductStack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={{
          title: 'Produto',
          headerLeft: undefined, // Quando entrar no Form, exibe a seta de VOLTAR nativa em vez do hamburguer
        }}
      />
    </ProductStack.Navigator>
  );
};

const AdminProfileScreen = () => {
  const { clearAuth, user } = useAuthStore();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Feather name="shield" size={32} color="#FF6B35" />
          </View>
          <Text style={styles.title}>{user?.name}</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMINISTRADOR</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações de Conta</Text>
          <Text style={styles.emptyText}>Menu de configurações do sistema em breve.</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => clearAuth()}
        >
          <Feather name="log-out" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sair do Painel Admin</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export const AdminNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FF6B35' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        drawerLabelStyle: { fontSize: 14 },
        drawerActiveTintColor: '#FF6B35',
      }}
    >
      <Drawer.Screen
        name="DashboardRoot"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="OrdersRoot"
        component={OrderManagementScreen}
        options={{
          title: 'Gestão de Pedidos',
          drawerLabel: 'Pedidos',
          drawerIcon: ({ color, size }) => <Feather name="clipboard" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="StockRoot"
        component={StockKanbanScreen}
        options={{
          title: 'Estoque Kanban',
          drawerLabel: 'Estoque',
          drawerIcon: ({ color, size }) => <Feather name="package" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="FeedbacksRoot"
        component={FeedbacksScreen}
        options={{
          title: 'Avaliações',
          drawerLabel: 'Feedbacks',
          drawerIcon: ({ color, size }) => <Feather name="star" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="ProductsRoot"
        component={ProductStackNavigator}
        options={{
          headerShown: true,
          title: 'Produtos',
          drawerLabel: 'Produtos',
          drawerIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          title: 'Perfil',
          drawerLabel: 'Perfil',
          drawerIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEFE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  adminBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 12,
  },
  adminBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
