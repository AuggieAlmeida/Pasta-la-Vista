import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCartStore } from '../../stores/cart.store';
import { ordersApi } from '../../api/endpoints/orders.api';
import { profileApi } from '../../api/endpoints/profile.api';
import { couponApi, ICouponValidation } from '../../api/endpoints/coupons.api';
import { CartItem } from '../../types/menu';
import { AddressModal } from '../../components/AddressModal';


const DELIVERY_FEE = 5.0;

const formatPrice = (price: number): string => {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

const PAYMENT_METHODS = [
  { value: 'PIX' as const, label: 'PIX' },
  { value: 'CREDIT_CARD' as const, label: 'Cartão de Crédito' },
  { value: 'CASH' as const, label: 'Dinheiro' },
];

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const {
    items,
    updateQuantity,
    removeItem,
    clear,
    getTotal,
  } = useCartStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'PIX' | 'CREDIT_CARD' | 'CASH' | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'DELIVERY' | 'PICKUP' | 'DINE_IN'>('DELIVERY');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [addressModalVisible, setAddressModalVisible] = React.useState(false);


  // Cupons
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<ICouponValidation | null>(null);

  // Address Query
  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: profileApi.getAddresses,
  });

  // Select default address initially
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses]);

  const subtotal = useMemo(() => getTotal(), [items, getTotal]);
  const currentDeliveryFee = deliveryMode === 'DELIVERY' ? DELIVERY_FEE : 0;
  
  let finalDiscount = 0;
  if (activeCoupon) {
    if (activeCoupon.discountType === 'PERCENTAGE') {
      finalDiscount = subtotal * (activeCoupon.discountValue / 100);
    } else {
      finalDiscount = activeCoupon.discountValue;
    }
    if (finalDiscount > subtotal) finalDiscount = subtotal;
  }

  const total = useMemo(() => subtotal + currentDeliveryFee - finalDiscount, [subtotal, currentDeliveryFee, finalDiscount]);

  const validateCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    try {
      const res = await couponApi.validateCoupon(couponCode);
      setActiveCoupon(res);
      Toast.show({ type: 'success', text1: 'Cupom Aplicado!' });
    } catch (err: any) {
      setActiveCoupon(null);
      Toast.show({ type: 'error', text1: 'Falha no cupom', text2: err.response?.data?.message || 'Cupom inválido' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = useCallback(
    async () => {
      if (items.length === 0) {
        Toast.show({ type: 'error', text1: 'Carrinho vazio' });
        return;
      }

      // Validacoes
      if (!selectedPayment) {
        Toast.show({ type: 'error', text1: 'Selecione um pagamento' });
        return;
      }
      if (deliveryMode === 'DELIVERY' && !selectedAddressId) {
        Toast.show({ type: 'error', text1: 'Selecione um endereco para entrega' });
        return;
      }
      if (deliveryMode === 'DINE_IN' && !tableNumber.trim()) {
        Toast.show({ type: 'error', text1: 'Informe o número da mesa' });
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
          delivery_mode: deliveryMode,
          payment_method: selectedPayment,
          notes,
          ...(deliveryMode === 'DELIVERY' && selectedAddressId
            ? { address_id: selectedAddressId }
            : {}),
          ...(deliveryMode === 'DINE_IN' ? { table_number: tableNumber.trim() } : {}),
          ...(activeCoupon ? { coupon_code: activeCoupon.code } : {}),
        };

        const order = await ordersApi.createOrder(orderDto);

        clear();
        queryClient.invalidateQueries({ queryKey: ['user-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        navigation.navigate('OrderConfirmation', { orderId: order.id });
      } catch (error: any) {
        const message = error.response?.data?.message || 'Erro ao criar pedido.';
        Toast.show({ type: 'error', text1: 'Erro', text2: message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      items,
      selectedPayment,
      deliveryMode,
      selectedAddressId,
      tableNumber,
      activeCoupon,
      notes,
      clear,
      navigation,
      queryClient,
    ]
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
            <TouchableOpacity style={styles.qtyButton} onPress={() => { item.quantity <= 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1) }}>
              <Text style={styles.qtyButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
              <Text style={styles.qtyButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cartItemSubtotal}>
            {formatPrice(item.subtotal)}
          </Text>
          <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id)}>
            <FontAwesome5 name="trash-alt" size={16} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [removeItem, updateQuantity]
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Seu carrinho esta vazio</Text>
        <Text style={styles.emptySubtitle}>Adicione produtos para começar</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.menuButtonText}>Ver Cardapio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carrinho</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cartHeader}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
          <TouchableOpacity style={styles.emptyCartButton} onPress={clear}>
            <FontAwesome5 name="trash" size={14} color="#FF6B35" />
            <Text style={styles.emptyCartText}>Esvaziar</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => `${item.id}-${JSON.stringify(item.customizations)}`}
        scrollEnabled={false}
      />

      <Text style={styles.sectionTitle}>Modo de Entrega</Text>
      <View style={styles.logisticsHeader}>
        <TouchableOpacity style={[styles.logisticBtn, deliveryMode === 'DELIVERY' && styles.logisticBtnActive]} onPress={() => setDeliveryMode('DELIVERY')}>
          <FontAwesome5 name="motorcycle" size={16} color={deliveryMode === 'DELIVERY' ? '#FFF' : '#666'} />
          <Text style={[styles.logisticBtnText, deliveryMode === 'DELIVERY' && styles.logisticBtnTextActive]}>Entregar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.logisticBtn, deliveryMode === 'PICKUP' && styles.logisticBtnActive]} onPress={() => setDeliveryMode('PICKUP')}>
          <FontAwesome5 name="shopping-bag" size={16} color={deliveryMode === 'PICKUP' ? '#FFF' : '#666'} />
          <Text style={[styles.logisticBtnText, deliveryMode === 'PICKUP' && styles.logisticBtnTextActive]}>Retirar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.logisticBtn, deliveryMode === 'DINE_IN' && styles.logisticBtnActive]} onPress={() => setDeliveryMode('DINE_IN')}>
          <FontAwesome5 name="utensils" size={16} color={deliveryMode === 'DINE_IN' ? '#FFF' : '#666'} />
          <Text style={[styles.logisticBtnText, deliveryMode === 'DINE_IN' && styles.logisticBtnTextActive]}>Mesa</Text>
        </TouchableOpacity>
      </View>

      {deliveryMode === 'DELIVERY' && (
        <View style={styles.formSection}>
          <View style={styles.sectionRow}>
            <Text style={styles.inputLabel}>Selecione um Endereço</Text>
            <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                <FontAwesome5 name="plus-circle" size={16} color="#FF6B35" />
            </TouchableOpacity>
          </View>
          {loadingAddresses ? (

            <ActivityIndicator color="#FF6B35" />
          ) : addresses && addresses.length > 0 ? (
            addresses.map(addr => (
              <TouchableOpacity key={addr.id} style={[styles.addressItem, selectedAddressId === addr.id && styles.addressItemActive]} onPress={() => setSelectedAddressId(addr.id)}>
                <FontAwesome5 name="map-marker-alt" size={16} color={selectedAddressId === addr.id ? '#FF6B35' : '#CCC'} />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressStreet}>{addr.street}, {addr.number}</Text>
                  <Text style={styles.addressCity}>{addr.city} - {addr.state}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: '#999', fontSize: 13, marginVertical: 8 }}>
              Toque em + para cadastrar um endereço (também em Perfil).
            </Text>
          )}
        </View>
      )}

      {deliveryMode === 'DINE_IN' && (
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Número da Mesa</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 12"
            value={tableNumber}
            onChangeText={setTableNumber}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Notes */}
      <Text style={styles.sectionTitle}>Observações</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Alguma observação extra?"
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
      />

      {/* Cupons */}
      <Text style={styles.sectionTitle}>Cupom de Desconto</Text>
      <View style={styles.couponRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8, marginTop: 0 }]}
          placeholder="Insira seu código"
          value={couponCode}
          onChangeText={setCouponCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.couponBtn} onPress={validateCoupon} disabled={couponLoading}>
          {couponLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.couponBtnText}>Aplicar</Text>}
        </TouchableOpacity>
      </View>
      {activeCoupon && (
        <Text style={styles.couponSuccessText}>
          Desconto de {activeCoupon.discountType === 'PERCENTAGE' ? `${activeCoupon.discountValue}%` : formatPrice(activeCoupon.discountValue)} aplicado!
        </Text>
      )}

      <Text style={styles.sectionTitle}>Método de Pagamento</Text>
      <View style={styles.paymentSection}>
        {PAYMENT_METHODS.map((method) => (
          <View key={method.value}>
            <TouchableOpacity
              style={[styles.paymentOption, selectedPayment === method.value && styles.paymentOptionActive]}
              onPress={() => setSelectedPayment(method.value)}
            >
              <View style={styles.radio}>
                {selectedPayment === method.value && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.paymentLabel, selectedPayment === method.value && styles.paymentLabelActive]}>
                {method.label}
              </Text>
            </TouchableOpacity>

          </View>
        ))}
      </View>


      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Taxa de entrega</Text>
          <Text style={styles.summaryValue}>{formatPrice(currentDeliveryFee)}</Text>
        </View>
        {activeCoupon && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Cupom ({activeCoupon.code})</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>- {formatPrice(finalDiscount)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
        onPress={handleCheckout}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
        )}
      </TouchableOpacity>
      </ScrollView>

      <AddressModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSaved={(addr) => setSelectedAddressId(addr.id)}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { backgroundColor: '#FF6B35', padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginTop: 10 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', marginBottom: 24, textAlign: 'center' },
  menuButton: { backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  menuButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginTop: 20, marginBottom: 12 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingRight: 8 },
  emptyCartButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FFEFE5', borderRadius: 8 },
  emptyCartText: { fontSize: 13, fontWeight: '700', color: '#FF6B35' },
  cartItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  cartItemInfo: { flex: 1, marginRight: 12 },
  cartItemName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  cartItemCustom: { fontSize: 12, color: '#999', marginTop: 2 },
  cartItemPrice: { fontSize: 12, color: '#666', marginTop: 4 },
  cartItemActions: { alignItems: 'flex-end' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  qtyButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  qtyButtonText: { fontSize: 16, fontWeight: '700', color: '#FF6B35' },
  qtyValue: { fontSize: 14, fontWeight: '600', marginHorizontal: 12, color: '#1a1a1a' },
  cartItemSubtotal: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },
  removeButton: { marginTop: 4, padding: 4 },
  logisticsHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 12, padding: 4, elevation: 1 },
  logisticBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, columnGap: 6 },
  logisticBtnActive: { backgroundColor: '#FF6B35' },
  logisticBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  logisticBtnTextActive: { color: '#FFF' },
  formSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginTop: 12 },
  addressItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EEE', marginBottom: 8 },
  addressItemActive: { borderColor: '#FF6B35', backgroundColor: '#FFF8F5' },
  addressInfo: { marginLeft: 12, flex: 1 },
  addressStreet: { fontSize: 14, fontWeight: '600', color: '#333' },
  addressCity: { fontSize: 12, color: '#666', marginTop: 2 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#666' },

  input: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#DDD', marginTop: 12 },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  couponRow: { flexDirection: 'row', alignItems: 'center' },
  couponBtn: { backgroundColor: '#333', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 8, justifyContent: 'center' },
  couponBtnText: { color: '#FFF', fontWeight: '700' },
  couponSuccessText: { color: '#4CAF50', fontSize: 13, fontWeight: '600', marginTop: 8 },
  paymentSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EEE', marginBottom: 8 },
  paymentOptionActive: { borderColor: '#FF6B35', backgroundColor: '#FFF8F5' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B35' },
  paymentLabel: { fontSize: 14, color: '#333' },
  paymentLabelActive: { fontWeight: '600', color: '#FF6B35' },
  creditHint: { fontSize: 12, color: '#666', marginLeft: 32, marginBottom: 8, lineHeight: 16 },
  summary: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginTop: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 8, marginTop: 4, marginBottom: 0 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#FF6B35' },
  confirmButton: { backgroundColor: '#FF6B35', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
