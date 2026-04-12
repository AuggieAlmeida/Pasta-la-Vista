import api from '../axios';

export interface UserAddress {
  id: string;
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export interface UserCard {
  id: string;
  last4: string;
  brand: string;
  isDefault: boolean;
}

export const profileApi = {
  getAddresses: async (): Promise<UserAddress[]> => {
    const { data } = await api.get('/api/v1/profile/addresses');
    return data.data;
  },
  addAddress: async (addressData: Omit<UserAddress, 'id'>): Promise<UserAddress> => {
    const { data } = await api.post('/api/v1/profile/addresses', addressData);
    return data.data;
  },
  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/profile/addresses/${id}`);
  },

  getCards: async (): Promise<UserCard[]> => {
    const { data } = await api.get('/api/v1/profile/cards');
    return data.data;
  },
  addCard: async (cardData: Omit<UserCard, 'id'> & { stripePaymentMethodId: string }): Promise<UserCard> => {
    const { data } = await api.post('/api/v1/profile/cards', cardData);
    return data.data;
  },
  deleteCard: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/profile/cards/${id}`);
  },

  /** LGPD: exclusão de conta (rota em auth) */
  deleteAccount: async (): Promise<void> => {
    await api.delete('/api/v1/auth/conta');
  },
};
