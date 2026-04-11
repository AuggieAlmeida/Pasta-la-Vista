import api from '../axios';
import { IOrder } from '../../types/menu';

interface ApiResponse<T> {
  status: string;
  data: T;
}

interface CreateOrderDto {
  items: {
    product_id: string;
    quantity: number;
    customizations: {
      customization_id: string;
      price_modifier: number;
    }[];
    obs?: string;
  }[];
  address: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zip: string;
  };
  notes?: string;
  payment_method: 'PIX' | 'CREDIT_CARD' | 'CASH';
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
};
