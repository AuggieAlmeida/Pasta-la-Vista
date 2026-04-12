import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAdminOrders, useUpdateOrderStatus } from '../../hooks/useAdmin';
import { AdminOrder } from '../../api/endpoints/admin.api';
import { FontAwesome5 } from '@expo/vector-icons';

const COLORS = {
  primary: '#FF6B35',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1a1a1a',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};

const ORDER_STATUS_MAP: Record<string, { label: string; color: string; next?: string }> = {
  PENDING: { label: 'Aguardando Confirmação', color: '#F59E0B', next: 'CONFIRMED' }, // Pagamento não caiu ou dinheiro na entrega
  CONFIRMED: { label: 'Confirmado', color: '#3B82F6', next: 'PREPARING' },
  PREPARING: { label: 'Preparando', color: '#8B5CF6', next: 'READY' },
  READY: { label: 'Pronto p/ Entrega', color: '#10B981', next: 'DELIVERED' },
  DELIVERED: { label: 'Entregue', color: '#059669' },
  CANCELLED: { label: 'Cancelado', color: '#EF4444' },
};

export const OrderManagementScreen: React.FC = () => {
  const { data: orders, isLoading, refetch, isRefetching } = useAdminOrders();
  const updateStatusMutation = useUpdateOrderStatus();
  const [filter, setFilter] = useState<string>('ALL');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const handleUpdateStatus = (order: AdminOrder) => {
    const nextStatus = ORDER_STATUS_MAP[order.status]?.next;

    if (!nextStatus) return;

    Alert.alert(
      'Atualizar Status',
      `Mover pedido #${order.id.slice(-6)} para "${ORDER_STATUS_MAP[nextStatus].label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            updateStatusMutation.mutate({
              orderId: order.id,
              status: nextStatus
            });
          }
        }
      ]
    );
  };

  const handleCancelOrder = (order: AdminOrder) => {
    Alert.alert(
      'Cancelar Pedido',
      `Tem certeza que deseja cancelar o pedido #${order.id.slice(-6)}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: () => {
            updateStatusMutation.mutate({
              orderId: order.id,
              status: 'CANCELLED'
            });
          }
        }
      ]
    );
  };

  const filteredOrders = orders?.filter(o => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return !['DELIVERED', 'CANCELLED', 'PENDING'].includes(o.status);
    return o.status === filter;
  }) || [];

  return (
    <View style={styles.container}>
      {/* Filtros horizontais */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}
            onPress={() => setFilter('ALL')}
          >
            <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'ACTIVE' && styles.filterChipActive]}
            onPress={() => setFilter('ACTIVE')}
          >
            <Text style={[styles.filterText, filter === 'ACTIVE' && styles.filterTextActive]}>Ativos (Cozinha)</Text>
          </TouchableOpacity>
          {['PENDING', 'CONFIRMED', 'DELIVERED'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filter === status && styles.filterChipActive]}
              onPress={() => setFilter(status)}
            >
              <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
                {ORDER_STATUS_MAP[status].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = ORDER_STATUS_MAP[order.status];
            const hasNextStep = !!statusConfig?.next;
            const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

            return (
              <View key={order.id} style={styles.card}>
                {/* Cabecalho do card */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Info do Cliente */}
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{order.userName}</Text>
                  <Text style={styles.clientAddress} numberOfLines={2}>
                    {order.delivery_mode === 'DELIVERY' 
                      ? (order.address ? `${order.address.street}, ${order.address.number} - ${order.address.city}` : 'Endereço não disponível')
                      : order.delivery_mode === 'PICKUP' ? 'Retirada no Balcão' : `Consumo no Local - Mesa ${order.table_number || 'N/A'}`
                    }
                  </Text>
                </View>

                {/* Items */}
                <View style={styles.itemsList}>
                  {order.items.map((item, idx) => (
                    <Text key={idx} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{item.quantity}x </Text>
                      {item.product_name || `Produto ${item.product_id.slice(-4)}`}
                    </Text>
                  ))}
                </View>

                {/* Notes */}
                {order.notes ? (
                  <View style={styles.notesBox}>
                    <View style={styles.notesTitleContainer}>
                      <FontAwesome5 name="clipboard-list" size={14} color="#92400E" />
                      <Text style={styles.notesTitle}> Observacoes do cliente:</Text>
                    </View>
                    <Text style={styles.notesText}>{order.notes}</Text>
                  </View>
                ) : null}

                {/* Footer and Actions */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>R$ {order.total.toFixed(2).replace('.', ',')}</Text>
                  </View>

                  <View style={styles.actionsBox}>
                    {hasNextStep && (
                      <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: ORDER_STATUS_MAP[statusConfig.next!].color }]}
                        onPress={() => handleUpdateStatus(order)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={styles.nextBtnText}>
                            Mover p/ {ORDER_STATUS_MAP[statusConfig.next!].label}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {canCancel && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => handleCancelOrder(order)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  filtersWrapper: {
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
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
  clientInfo: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  clientAddress: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginBottom: 16,
    gap: 4,
  },
  itemRow: {
    fontSize: 14,
    color: COLORS.text,
  },
  itemQty: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  notesBox: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  notesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  notesText: {
    fontSize: 13,
    color: '#B45309',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  actionsBox: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#F00',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#F00',
    fontWeight: '600',
    fontSize: 13,
  },
  nextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
