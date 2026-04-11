import api from '../axios';
import { IProduct } from '../../types/menu';

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const menuApi = {
  async fetchMenu(): Promise<IProduct[]> {
    const response = await api.get<ApiResponse<IProduct[]>>('/api/v1/menu');
    return response.data.data;
  },

  async fetchProductById(id: string): Promise<IProduct> {
    const response = await api.get<ApiResponse<IProduct>>(`/api/v1/menu/${id}`);
    return response.data.data;
  },

  async fetchByCategory(category: string): Promise<IProduct[]> {
    const response = await api.get<ApiResponse<IProduct[]>>(
      `/api/v1/menu/category/${category}`
    );
    return response.data.data;
  },

  async searchProducts(query: string): Promise<IProduct[]> {
    const response = await api.get<ApiResponse<IProduct[]>>(
      `/api/v1/menu/search`,
      { params: { q: query } }
    );
    return response.data.data;
  },
};
