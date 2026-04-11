import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ordersApi } from '../../api/endpoints/orders.api';

type RouteParams = {
  OrderConfirmation: { orderId: string };
};

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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Aguardando Confirmacao', color: '#F59E0B' },
  CONFIRMED: { label: 'Confirmado', color: '#3B82F6' },
  PREPARING: { label: 'Em Preparo', color: '#8B5CF6' },
  READY: { label: 'Pronto', color: '#10B981' },
  DELIVERED: { label: 'Entregue', color: '#059669' },
  CANCELLED: { label: 'Cancelado', color: '#EF4444' },
};

export const OrderConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'OrderConfirmation'>>();
  const { orderId } = route.params;

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOrder(orderId),
    refetchInterval: 15000,
    enabled: !!orderId,
  });

  const handleContinueShopping = useCallback(() => {
    navigation.navigate('Menu');
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando detalhes do pedido...</Text>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erro ao carregar pedido</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleContinueShopping}
        >
          <Text style={styles.retryText}>Voltar ao Cardapio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Success Header */}
      <View style={styles.successHeader}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>OK</Text>
        </View>
        <Text style={styles.successTitle}>Pedido Confirmado!</Text>
        <Text style={styles.orderId}>Pedido #{order.id.slice(0, 8)}</Text>
        <Text style={styles.timestamp}>{formatDate(order.createdAt)}</Text>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.label}
        </Text>
      </View>

      {/* Order Items */}
      <Text style={styles.sectionTitle}>Itens do Pedido</Text>
      <View style={styles.itemsCard}>
        {order.items.map((item, index) => (
          <View
            key={index}
            style={[
              styles.orderItem,
              index < order.items.length - 1 && styles.orderItemBorder,
            ]}
          >
            <View style={styles.orderItemLeft}>
              <Text style={styles.orderItemName}>{item.product_name}</Text>
              {item.customizations.length > 0 && (
                <Text style={styles.orderItemCustom}>
                  {item.customizations.map((c) => c.name).join(', ')}
                </Text>
              )}
              <Text style={styles.orderItemQty}>
                {item.quantity}x {formatPrice(item.unit_price)}
              </Text>
            </View>
            <Text style={styles.orderItemSubtotal}>
              {formatPrice(item.subtotal)}
            </Text>
          </View>
        ))}
      </View>

      {/* Total Breakdown */}
      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Subtotal</Text>
          <Text style={styles.breakdownValue}>
            {formatPrice(order.subtotal)}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Taxa de entrega</Text>
          <Text style={styles.breakdownValue}>
            {formatPrice(order.delivery_fee)}
          </Text>
        </View>
        {order.discount > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Desconto</Text>
            <Text style={[styles.breakdownValue, { color: '#10B981' }]}>
              -{formatPrice(order.discount)}
            </Text>
          </View>
        )}
        <View style={[styles.breakdownRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
        </View>
      </View>

      {/* Auto-refresh notice */}
      <Text style={styles.refreshNotice}>
        Status atualizado automaticamente a cada 15 segundos
      </Text>

      {/* Continue Shopping */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinueShopping}
        activeOpacity={0.7}
      >
        <Text style={styles.continueButtonText}>Continuar Comprando</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  orderItemCustom: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  orderItemQty: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderItemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  breakdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B35',
  },
  refreshNotice: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
