import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useAdminStock, useUpdateStock } from '../../hooks/useAdmin';
import { StockItem } from '../../api/endpoints/admin.api';

const COLORS = {
  primary: '#FF6B35',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1a1a1a',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  AVAILABLE: '#10B981',
  LOW: '#F59E0B',
  OUT_OF_STOCK: '#EF4444',
};

const STATUS_LABELS = {
  AVAILABLE: 'Disponível',
  LOW: 'Estoque Baixo',
  OUT_OF_STOCK: 'Esgotado',
};

export const StockKanbanScreen: React.FC = () => {
  const { data: stockItems, isLoading, refetch, isRefetching } = useAdminStock();
  const updateStockMutation = useUpdateStock();

  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Agrupar itens por status
  const columns: Record<string, StockItem[]> = {
    AVAILABLE: [],
    LOW: [],
    OUT_OF_STOCK: [],
  };

  stockItems?.forEach((item) => {
    if (columns[item.status]) {
      columns[item.status].push(item);
    }
  });

  const handleOpenModal = (item: StockItem) => {
    setSelectedItem(item);
    setNewQuantity(item.quantity.toString());
    setModalVisible(true);
  };

  const handleUpdateQuantity = () => {
    if (!selectedItem) return;

    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 0) return;

    updateStockMutation.mutate(
      {
        stockId: selectedItem.id,
        data: { quantity: qty },
      },
      {
        onSuccess: () => {
          setModalVisible(false);
          setSelectedItem(null);
        },
      }
    );
  };

  const renderColumn = (status: keyof typeof STATUS_LABELS) => {
    const items = columns[status];
    const color = COLORS[status];

    return (
      <View key={status} style={styles.column}>
        <View style={[styles.columnHeader, { borderTopColor: color }]}>
          <Text style={[styles.columnTitle, { color }]}>{STATUS_LABELS[status]}</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeText}>{items.length}</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.columnContent}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { borderLeftColor: color }]}
              onPress={() => handleOpenModal(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.itemName} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={styles.itemCategory}>{item.productCategory}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.itemQty}>{item.quantity} un.</Text>
                <Text style={styles.itemMin}>Min: {item.minQuantity}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {items.length === 0 && (
            <Text style={styles.emptyText}>Nenhum item</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.board}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {renderColumn('AVAILABLE')}
        {renderColumn('LOW')}
        {renderColumn('OUT_OF_STOCK')}
      </ScrollView>

      {/* Modal para atualizar quantidade */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atualizar Estoque</Text>
            <Text style={styles.modalSubtitle}>{selectedItem?.productName}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nova Quantidade (unidades)</Text>
              <TextInput
                style={styles.input}
                value={newQuantity}
                onChangeText={setNewQuantity}
                keyboardType="number-pad"
                selectTextOnFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
                disabled={updateStockMutation.isPending}
              >
                <Text style={styles.buttonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleUpdateQuantity}
                disabled={updateStockMutation.isPending}
              >
                {updateStockMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonSaveText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  board: {
    padding: 16,
    gap: 16,
  },
  column: {
    width: 260,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 8,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  columnTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  badgeCount: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  columnContent: {
    gap: 8,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemMin: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 20,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: '#F3F4F6',
  },
  buttonCancelText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  buttonSave: {
    backgroundColor: COLORS.primary,
  },
  buttonSaveText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
