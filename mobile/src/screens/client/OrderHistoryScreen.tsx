import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { ordersApi } from '../../api/endpoints/orders.api';
import { IOrder } from '../../types/menu';

const formatPrice = (price: number): string => {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendente', color: '#F59E0B', bg: '#FEF3C7' },
  CONFIRMED: { label: 'Confirmado', color: '#3B82F6', bg: '#DBEAFE' },
  PREPARING: { label: 'Preparando', color: '#8B5CF6', bg: '#EDE9FE' },
  READY: { label: 'Pronto', color: '#10B981', bg: '#D1FAE5' },
  DELIVERED: { label: 'Entregue', color: '#059669', bg: '#A7F3D0' },
  CANCELLED: { label: 'Cancelado', color: '#EF4444', bg: '#FEE2E2' },
};

export const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.listOrders,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30000,
  });

  const handleOrderPress = useCallback(
    (orderId: string) => {
      navigation.navigate('OrderConfirmation', { orderId });
    },
    [navigation]
  );

  const renderOrder = useCallback(
    ({ item }: { item: IOrder }) => {
      const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;

      return (
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => handleOrderPress(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.orderItems}>
            {item.items.length} {item.items.length === 1 ? 'item' : 'itens'}
          </Text>
          <View style={styles.orderFooter}>
            <Text style={styles.orderTotal}>{formatPrice(item.total)}</Text>
            <Text style={styles.viewDetails}>Ver detalhes</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleOrderPress]
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando pedidos...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erro ao carregar pedidos</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
            <Text style={styles.emptySubtitle}>
              Seus pedidos aparecerão aqui
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  orderItems: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6B35',
  },
  viewDetails: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
});
