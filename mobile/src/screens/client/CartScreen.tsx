import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCartStore } from '../../stores/cart.store';
import { ordersApi } from '../../api/endpoints/orders.api';
import { CheckoutSchema, CheckoutInput, CartItem } from '../../types/menu';

const DELIVERY_FEE = 5.0;

const formatPrice = (price: number): string => {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

const PAYMENT_METHODS = [
  { value: 'PIX' as const, label: 'PIX' },
  { value: 'CREDIT_CARD' as const, label: 'Cartao de Credito' },
  { value: 'CASH' as const, label: 'Dinheiro' },
];

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    items,
    updateQuantity,
    removeItem,
    clear,
    getTotal,
  } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'PIX' | 'CREDIT_CARD' | 'CASH' | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      address: {
        street: '',
        number: '',
        complement: '',
        city: '',
        state: '',
        zip: '',
      },
      notes: '',
      payment_method: undefined,
    },
  });

  const subtotal = useMemo(() => getTotal(), [items, getTotal]);
  const total = useMemo(() => subtotal + DELIVERY_FEE, [subtotal]);

  const handleCheckout = useCallback(
    async (data: CheckoutInput) => {
      if (items.length === 0) {
        Alert.alert('Carrinho vazio', 'Adicione itens ao carrinho antes de confirmar.');
        return;
      }

      if (!selectedPayment) {
        Alert.alert('Pagamento', 'Selecione um metodo de pagamento.');
        return;
      }

      setIsSubmitting(true);

      try {
        const orderDto = {
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            customizations: item.customizations.map((c) => ({
              customization_id: c.id,
              price_modifier: c.price_modifier,
            })),
          })),
          address: data.address,
          notes: data.notes,
          payment_method: selectedPayment,
        };

        const order = await ordersApi.createOrder(orderDto);

        clear();
        navigation.navigate('OrderConfirmation', { orderId: order.id });
      } catch (error: any) {
        const message =
          error.response?.data?.message || 'Erro ao criar pedido. Tente novamente.';
        Alert.alert('Erro', message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [items, selectedPayment, clear, navigation]
  );

  const renderCartItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <View style={styles.cartItem}>
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName}>{item.name}</Text>
          {item.customizations.length > 0 && (
            <Text style={styles.cartItemCustom}>
              {item.customizations.map((c) => c.name).join(', ')}
            </Text>
          )}
          <Text style={styles.cartItemPrice}>
            {formatPrice(item.unit_price)} cada
          </Text>
        </View>
        <View style={styles.cartItemActions}>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => {
                if (item.quantity <= 1) {
                  removeItem(item.id);
                } else {
                  updateQuantity(item.id, item.quantity - 1);
                }
              }}
            >
              <Text style={styles.qtyButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Text style={styles.qtyButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cartItemSubtotal}>
            {formatPrice(item.subtotal)}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(item.id)}
          >
            <Text style={styles.removeButtonText}>X</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [removeItem, updateQuantity]
  );

  // Empty cart
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Seu carrinho esta vazio</Text>
        <Text style={styles.emptySubtitle}>
          Adicione produtos do cardapio para comecar
        </Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.menuButtonText}>Ver Cardapio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Cart Items */}
      <Text style={styles.sectionTitle}>Itens do Pedido</Text>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => `${item.id}-${JSON.stringify(item.customizations)}`}
        scrollEnabled={false}
      />

      {/* Address Form */}
      <Text style={styles.sectionTitle}>Endereco de Entrega</Text>
      <View style={styles.formSection}>
        <Controller
          control={control}
          name="address.street"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rua</Text>
              <TextInput
                style={[styles.input, errors.address?.street && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Nome da rua"
                placeholderTextColor="#999"
              />
              {errors.address?.street && (
                <Text style={styles.errorText}>{errors.address.street.message}</Text>
              )}
            </View>
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="address.number"
            render={({ field: { onChange, value } }) => (
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Numero</Text>
                <TextInput
                  style={[styles.input, errors.address?.number && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="123"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            )}
          />
          <Controller
            control={control}
            name="address.complement"
            render={({ field: { onChange, value } }) => (
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Complemento</Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Apto 42"
                  placeholderTextColor="#999"
                />
              </View>
            )}
          />
        </View>

        <Controller
          control={control}
          name="address.city"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cidade</Text>
              <TextInput
                style={[styles.input, errors.address?.city && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Sao Paulo"
                placeholderTextColor="#999"
              />
            </View>
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="address.state"
            render={({ field: { onChange, value } }) => (
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Estado</Text>
                <TextInput
                  style={[styles.input, errors.address?.state && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="SP"
                  placeholderTextColor="#999"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            )}
          />
          <Controller
            control={control}
            name="address.zip"
            render={({ field: { onChange, value } }) => (
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>CEP</Text>
                <TextInput
                  style={[styles.input, errors.address?.zip && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="01234-567"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            )}
          />
        </View>
      </View>

      {/* Notes */}
      <Text style={styles.sectionTitle}>Observacoes</Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={value}
            onChangeText={onChange}
            placeholder="Alguma observacao para o restaurante?"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        )}
      />

      {/* Payment Method */}
      <Text style={styles.sectionTitle}>Metodo de Pagamento</Text>
      <View style={styles.paymentSection}>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.value}
            style={[
              styles.paymentOption,
              selectedPayment === method.value && styles.paymentOptionActive,
            ]}
            onPress={() => setSelectedPayment(method.value)}
            activeOpacity={0.7}
          >
            <View style={styles.radio}>
              {selectedPayment === method.value && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text
              style={[
                styles.paymentLabel,
                selectedPayment === method.value && styles.paymentLabelActive,
              ]}
            >
              {method.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Taxa de entrega</Text>
          <Text style={styles.summaryValue}>{formatPrice(DELIVERY_FEE)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
        onPress={handleSubmit(handleCheckout)}
        disabled={isSubmitting}
        activeOpacity={0.7}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
        )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
  menuButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 12,
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cartItemCustom: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cartItemActions: {
    alignItems: 'flex-end',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 12,
    color: '#1a1a1a',
  },
  cartItemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
  },
  removeButton: {
    marginTop: 4,
    padding: 4,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#FF4444',
    fontWeight: '700',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    fontSize: 11,
    color: '#FF4444',
    marginTop: 4,
  },
  notesInput: {
    minHeight: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
  },
  paymentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 8,
  },
  paymentOptionActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F5',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#333',
  },
  paymentLabelActive: {
    fontWeight: '600',
    color: '#FF6B35',
  },
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
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
  confirmButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
