import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useCartStore } from '../stores/cart.store';
import { MenuScreen } from '../screens/client/MenuScreen';
import { CartScreen } from '../screens/client/CartScreen';
import { OrderHistoryScreen } from '../screens/client/OrderHistoryScreen';
import { OrderConfirmationScreen } from '../screens/client/OrderConfirmationScreen';
import { PaymentScreen } from '../screens/client/PaymentScreen';

const Tab = createBottomTabNavigator();
const MenuStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const OrderStack = createNativeStackNavigator();

import { ProfileScreen } from '../screens/client/ProfileScreen';
import { FavoritesScreen } from '../screens/client/FavoritesScreen';

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
    <CartStack.Screen name="Carrinho" component={CartScreen} />
    <CartStack.Screen
      name="OrderConfirmation"
      component={OrderConfirmationScreen}
      options={{ headerShown: true, title: 'Pedido' }}
    />
    <CartStack.Screen
      name="Payment"
      component={PaymentScreen}
      options={{ headerShown: true, title: 'Pagamento' }}
    />
  </CartStack.Navigator>
);

const OrderStackNavigator: React.FC = () => (
  <OrderStack.Navigator screenOptions={{ headerShown: false }}>
    <OrderStack.Screen name="Histórico" component={OrderHistoryScreen} />
    <OrderStack.Screen
      name="OrderConfirmation"
      component={OrderConfirmationScreen}
      options={{ headerShown: true, title: 'Pedido' }}
    />
    <OrderStack.Screen
      name="Payment"
      component={PaymentScreen}
      options={{ headerShown: true, title: 'Pagamento' }}
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
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'ios' ? 12 : 12,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 60 : 60,
        },
      }}
    >
      <Tab.Screen
        name="Menu"
        component={MenuStackNavigator}
        options={{
          tabBarLabel: 'Cardapio',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="utensils" size={size || 20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartStackNavigator}
        options={{
          tabBarLabel: 'Carrinho',
          tabBarIcon: ({ color, size }) => (
            <View>
              <FontAwesome5 name="shopping-cart" size={size || 20} color={color} />
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
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="list-alt" size={size || 20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          headerShown: false,
          title: 'Favoritos',
          tabBarLabel: 'Favoritos',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="heart" size={size || 20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={size || 20} color={color} />
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
