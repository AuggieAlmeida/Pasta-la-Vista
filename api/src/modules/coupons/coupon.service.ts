import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';

export const couponService = {
  async validateCoupon(code: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      throw new ValidationError('Cupom inválido ou inativo');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new ValidationError('Este cupom já atingiu o limite de uso');
    }

    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
    };
  },
};
