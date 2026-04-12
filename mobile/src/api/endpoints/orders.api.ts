import api from '../axios';
import { IOrder } from '../../types/menu';

interface ApiResponse<T> {
  status: string;
  data: T;
}

/** Alinhado ao CreateOrderSchema da API (address_id + delivery_mode, etc.) */
export interface CreateOrderDto {
  items: {
    product_id: string;
    quantity: number;
    customizations: {
      customization_id: string;
      price_modifier: number;
    }[];
    obs?: string;
  }[];
  delivery_mode: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  payment_method: 'PIX' | 'CREDIT_CARD' | 'CASH';
  notes?: string;
  address_id?: string;
  table_number?: string;
  coupon_code?: string;
}

export const ordersApi = {
  async createOrder(dto: CreateOrderDto): Promise<IOrder> {
    const response = await api.post<ApiResponse<IOrder>>('/api/v1/orders', dto);
    return response.data.data;
  },

  async getOrder(id: string): Promise<IOrder> {
    const response = await api.get<ApiResponse<IOrder>>(`/api/v1/orders/${id}`);
    return response.data.data;
  },

  async listOrders(): Promise<IOrder[]> {
    const response = await api.get<ApiResponse<IOrder[]>>('/api/v1/orders');
    return response.data.data;
  },

  async addReview(id: string, rating: number, comment: string): Promise<IOrder> {
    const response = await api.post<ApiResponse<IOrder>>(`/api/v1/orders/${id}/avaliacao`, { rating, comment });
    return response.data.data;
  },
};
