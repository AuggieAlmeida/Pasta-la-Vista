import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native';
import { useQuery } from '@tanstack/react-query';
import { FontAwesome5 } from '@expo/vector-icons';
import { paymentApi, CheckoutResponse } from '../../api/endpoints/payment.api';
import { profileApi, UserCard } from '../../api/endpoints/profile.api';
import { IOrder } from '../../types/menu';

const COLORS = {
  primary: '#FF6B35',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1a1a1a',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};

/** Pagar com cartão novo via Payment Sheet (sem PM salvo). */
const PAY_WITH_NEW_CARD = '__new__' as const;
type SavedPick = string | typeof PAY_WITH_NEW_CARD;

type PaymentRouteParams = {
  order: IOrder;
};

function cardIconName(brand: string): 'cc-visa' | 'cc-mastercard' | 'credit-card' {
  const brandKey = (brand || '').toLowerCase();
  if (brandKey === 'visa') return 'cc-visa';
  if (brandKey === 'mastercard') return 'cc-mastercard';
  return 'credit-card';
}

export const PaymentScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();

  const { order } = route.params as PaymentRouteParams;

  const { data: cards = [], isLoading: loadingCards } = useQuery({
    queryKey: ['user-cards'],
    queryFn: profileApi.getCards,
  });

  const [uiPhase, setUiPhase] = useState<
    'loading' | 'choose_card' | 'preparing' | 'pay' | 'empty_error'
  >('loading');
  const [savedPick, setSavedPick] = useState<SavedPick>(PAY_WITH_NEW_CARD);
  const [loading, setLoading] = useState(false);
  const [payReady, setPayReady] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [useSavedCardFlow, setUseSavedCardFlow] = useState(false);
  const emptyCardsCheckoutStarted = useRef(false);

  const orderId = order?.id;

  const runCheckoutInit = useCallback(
    async (savedCardId?: string) => {
      if (!orderId) return;
      setLoading(true);
      setPayReady(false);
      setCheckout(null);
      try {
        const session = await paymentApi.createCheckout(orderId, savedCardId);

        if (session.paymentMethodId) {
          setCheckout(session);
          setUseSavedCardFlow(true);
          setPayReady(true);
          setUiPhase('pay');
          return;
        }

        setCheckout(session);
        setUseSavedCardFlow(false);

        const { error } = await initPaymentSheet({
          merchantDisplayName: 'Pasta la Vista',
          paymentIntentClientSecret: session.clientSecret,
          defaultBillingDetails: {
            name: 'Cliente',
          },
          appearance: {
            colors: {
              primary: COLORS.primary,
              background: COLORS.bg,
              componentBackground: COLORS.card,
              componentBorder: COLORS.border,
              componentDivider: COLORS.border,
              primaryText: COLORS.text,
              secondaryText: COLORS.textMuted,
              componentText: COLORS.text,
              placeholderText: COLORS.textMuted,
            },
            shapes: {
              borderRadius: 12,
              borderWidth: 1,
            },
          },
        });

        if (!error) {
          setPayReady(true);
          setUiPhase('pay');
        } else {
          Toast.show({
            type: 'error',
            text1: 'Falha no provedor',
            text2: error.message,
          });
          setUiPhase((prev) =>
            prev === 'preparing' && cards.length === 0 ? 'empty_error' : 'choose_card'
          );
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Falha ao inicializar pagamento';
        Toast.show({
          type: 'error',
          text1: 'Erro de conexão',
          text2: message,
        });
        setUiPhase((prev) =>
          prev === 'preparing' && cards.length === 0 ? 'empty_error' : 'choose_card'
        );
      } finally {
        setLoading(false);
      }
    },
    [orderId, initPaymentSheet, cards.length]
  );

  useEffect(() => {
    if (!order) {
      Toast.show({
        type: 'error',
        text1: 'Pedido inválido',
        text2: 'Pedido não encontrado',
      });
      navigation.goBack();
    }
  }, [order, navigation]);

  useEffect(() => {
    if (!orderId || loadingCards) {
      setUiPhase('loading');
      return;
    }

    if (cards.length > 0) {
      const def = cards.find((c) => c.isDefault)?.id ?? cards[0].id;
      setSavedPick(def);
      setUiPhase((prev) => (prev === 'pay' || prev === 'preparing' ? prev : 'choose_card'));
      emptyCardsCheckoutStarted.current = false;
      return;
    }

    if (emptyCardsCheckoutStarted.current) return;
    emptyCardsCheckoutStarted.current = true;
    setSavedPick(PAY_WITH_NEW_CARD);
    setUiPhase('preparing');
    void runCheckoutInit(undefined);
  }, [orderId, loadingCards, cards, runCheckoutInit]);

  const handleContinueFromPick = useCallback(() => {
    const savedCardId = savedPick === PAY_WITH_NEW_CARD ? undefined : savedPick;
    setUiPhase('preparing');
    void runCheckoutInit(savedCardId);
  }, [savedPick, runCheckoutInit]);

  const handleRetryEmptyCheckout = useCallback(() => {
    emptyCardsCheckoutStarted.current = true;
    setUiPhase('preparing');
    void runCheckoutInit(undefined);
  }, [runCheckoutInit]);

  const handlePayPress = async () => {
    if (!checkout?.clientSecret) return;

    setLoading(true);

    if (useSavedCardFlow && checkout.paymentMethodId) {
      const { error } = await confirmPayment(checkout.clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          paymentMethodId: checkout.paymentMethodId,
        },
      });
      setLoading(false);

      if (error) {
        if (error.code !== 'Canceled') {
          Toast.show({
            type: 'error',
            text1: `Erro: ${error.code}`,
            text2: error.message,
          });
        }
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Confirmado',
        text2: 'Seu pagamento foi aprovado!',
      });
      navigation.replace('OrderConfirmation', { orderId: order.id });
      return;
    }

    const { error } = await presentPaymentSheet();
    setLoading(false);

    if (error) {
      if (error.code !== 'Canceled') {
        Toast.show({
          type: 'error',
          text1: `Erro: ${error.code}`,
          text2: error.message,
        });
      }
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Confirmado',
      text2: 'Seu pagamento foi aprovado!',
    });
    navigation.replace('OrderConfirmation', { orderId: order.id });
  };

  if (!order) return null;

  const deliveryFee = order.delivery_fee ?? 0;

  const selectedSavedCard: UserCard | undefined =
    savedPick !== PAY_WITH_NEW_CARD ? cards.find((c) => c.id === savedPick) : undefined;

  const showChooseCard = uiPhase === 'choose_card';
  const showBusy = uiPhase === 'loading' || uiPhase === 'preparing';
  const showEmptyError = uiPhase === 'empty_error';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Resumo do Pagamento</Text>
        <Text style={styles.subtitle}>Pedido #{order.id.slice(-6).toUpperCase()}</Text>

        {selectedSavedCard && savedPick !== PAY_WITH_NEW_CARD && uiPhase === 'pay' ? (
          <View style={styles.savedCardBanner}>
            <Text style={styles.savedCardLabel}>Cartão selecionado</Text>
            <Text style={styles.savedCardValue}>
              {(selectedSavedCard.brand || 'Cartão').toUpperCase()} ···· {selectedSavedCard.last4}
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Subtotal + taxas</Text>
          <Text style={styles.value}>R$ {order.total.toFixed(2).replace('.', ',')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Taxa de entrega (no total)</Text>
          <Text style={styles.value}>R$ {deliveryFee.toFixed(2).replace('.', ',')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalValue}>R$ {order.total.toFixed(2).replace('.', ',')}</Text>
        </View>
      </View>

      {showChooseCard && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selecionar cartão </Text>
          <Text style={styles.sectionHint}>
            Escolha um cartão salvo no perfil ou use um cartão novo no passo seguinte.
          </Text>

          {cards.map((c) => {
            const selected = savedPick === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.pickRow, selected && styles.pickRowActive]}
                onPress={() => setSavedPick(c.id)}
                activeOpacity={0.85}
              >
                <View style={styles.radio}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <FontAwesome5
                  name={cardIconName(c.brand)}
                  size={18}
                  color={selected ? COLORS.primary : '#CCC'}
                  style={styles.pickIcon}
                />
                <View style={styles.pickTextWrap}>
                  <Text style={styles.pickTitle}>Final {c.last4}</Text>
                  <Text style={styles.pickSubtitle}>{(c.brand || 'Cartão').toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.pickRow, savedPick === PAY_WITH_NEW_CARD && styles.pickRowActive]}
            onPress={() => setSavedPick(PAY_WITH_NEW_CARD)}
            activeOpacity={0.85}
          >
            <View style={styles.radio}>
              {savedPick === PAY_WITH_NEW_CARD ? <View style={styles.radioInner} /> : null}
            </View>
            <FontAwesome5 name="plus-circle" size={18} color={COLORS.primary} style={styles.pickIcon} />
            <View style={styles.pickTextWrap}>
              <Text style={styles.pickTitle}>Outro cartão</Text>
              <Text style={styles.pickSubtitle}>Cadastrar novo cartão</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueButton, loading && styles.payButtonDisabled]}
            disabled={loading}
            onPress={handleContinueFromPick}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.payButtonText}>Continuar para pagamento</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {showEmptyError && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Não foi possível iniciar o pagamento</Text>
          <Text style={styles.sectionHint}>Verifique a conexão e tente de novo.</Text>
          <TouchableOpacity style={styles.continueButton} onPress={handleRetryEmptyCheckout}>
            <Text style={styles.payButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {showBusy && !showChooseCard && (
        <View style={styles.centerBusy}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.busyText}>
            {uiPhase === 'loading' ? 'Carregando seus cartões…' : 'Preparando pagamento…'}
          </Text>
        </View>
      )}

      {uiPhase === 'pay' && (
        <TouchableOpacity
          style={[styles.payButton, (!payReady || loading) && styles.payButtonDisabled]}
          disabled={!payReady || loading}
          onPress={handlePayPress}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.payButtonText}>
              {useSavedCardFlow ? 'Confirmar com cartão salvo' : 'Pagar com cartão'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  pickRowActive: {
    borderColor: COLORS.primary,
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
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  pickIcon: { marginRight: 10 },
  pickTextWrap: { flex: 1 },
  pickTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  pickSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  savedCardBanner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDBA74',
    marginBottom: 8,
  },
  savedCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A3412',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedCardValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C2410C',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  centerBusy: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  busyText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  payButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#9ca3af',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
