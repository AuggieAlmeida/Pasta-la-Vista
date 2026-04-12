import api from '../axios';

export interface CheckoutResponse {
  clientSecret: string;
  publishableKey: string;
  paymentIntentId: string;
  amount: number;
  /** Presente quando o checkout foi criado com cartão salvo (confirmar no app com `confirmPayment`). */
  paymentMethodId?: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const paymentApi = {
  /**
   * Cria um checkout (PaymentIntent) para um pedido existente
   */
  async createCheckout(orderId: string, savedCardId?: string): Promise<CheckoutResponse> {
    const response = await api.post<ApiResponse<CheckoutResponse>>(
      '/api/v1/pagamento/checkout',
      { orderId, ...(savedCardId ? { savedCardId } : {}) }
    );
    return response.data.data;
  },
};
