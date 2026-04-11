import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../stores/auth.store';
import { useCartStore } from '../stores/cart.store';
import { MenuScreen } from '../screens/client/MenuScreen';
import { CartScreen } from '../screens/client/CartScreen';
import { OrderHistoryScreen } from '../screens/client/OrderHistoryScreen';
import { OrderConfirmationScreen } from '../screens/client/OrderConfirmationScreen';

const Tab = createBottomTabNavigator();
const MenuStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const OrderStack = createNativeStackNavigator();

const ProfileScreen: React.FC = () => {
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

const MenuStackNavigator: React.FC = () => (
  <MenuStack.Navigator screenOptions={{ headerShown: false }}>
    <MenuStack.Screen name="MenuHome" component={MenuScreen} />
    <MenuStack.Screen
      name="OrderConfirmation"
      component={OrderConfirmationScreen}
      options={{ headerShown: true, title: 'Pedido' }}
    />
  </MenuStack.Navigator>
);

const CartStackNavigator: React.FC = () => (
  <CartStack.Navigator screenOptions={{ headerShown: false }}>
    <CartStack.Screen name="CartHome" component={CartScreen} />
    <CartStack.Screen
      name="OrderConfirmation"
      component={OrderConfirmationScreen}
      options={{ headerShown: true, title: 'Pedido' }}
    />
  </CartStack.Navigator>
);

const OrderStackNavigator: React.FC = () => (
  <OrderStack.Navigator screenOptions={{ headerShown: false }}>
    <OrderStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
    <OrderStack.Screen
      name="OrderConfirmation"
      component={OrderConfirmationScreen}
      options={{ headerShown: true, title: 'Pedido' }}
    />
  </OrderStack.Navigator>
);

const CartBadge: React.FC = () => {
  const itemCount = useCartStore((state) => state.getItemCount());

  if (itemCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {itemCount > 99 ? '99+' : itemCount}
      </Text>
    </View>
  );
};

export const ClientNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          paddingBottom: 4,
          paddingTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Menu"
        component={MenuStackNavigator}
        options={{
          tabBarLabel: 'Cardapio',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>M</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartStackNavigator}
        options={{
          tabBarLabel: 'Carrinho',
          tabBarIcon: ({ color }) => (
            <View>
              <Text style={{ fontSize: 20, color }}>C</Text>
              <CartBadge />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderStackNavigator}
        options={{
          tabBarLabel: 'Pedidos',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>P</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>U</Text>
          ),
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
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
