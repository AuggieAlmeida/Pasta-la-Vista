import { api } from '../axios';

export const favoritesApi = {
  addFavorite: async (productId: string) => {
    const { data } = await api.post('/api/v1/favoritos', { productId });
    return data;
  },
  removeFavorite: async (productId: string) => {
    const { data } = await api.delete(`/api/v1/favoritos/${encodeURIComponent(productId)}`);
    return data;
  },
  getFavorites: async (): Promise<string[]> => {
    const { data } = await api.get('/api/v1/favoritos');
    return data.data;
  },
};
