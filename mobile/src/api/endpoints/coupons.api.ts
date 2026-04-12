import { api } from '../axios';

export interface ICouponValidation {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
}

export const couponApi = {
  validateCoupon: async (code: string): Promise<ICouponValidation> => {
    const { data } = await api.post('/api/v1/cupons/validar', { code });
    return data.data;
  },
};
