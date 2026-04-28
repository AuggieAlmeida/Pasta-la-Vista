import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { CreateCouponInput } from './coupon.schema';

function toCouponDto(c: {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: { toString(): string };
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  createdAt: Date;
}) {
  return {
    id: c.id,
    code: c.code,
    discountType: c.discountType,
    discountValue: Number(c.discountValue),
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    active: c.active,
    createdAt: c.createdAt.toISOString(),
  };
}

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

  async listCoupons() {
    const rows = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toCouponDto);
  },

  async createCoupon(input: CreateCouponInput) {
    const code = input.code.toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new ValidationError('Já existe um cupom com este código');
    }
    const created = await prisma.coupon.create({
      data: {
        code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        usageLimit: input.usageLimit ?? null,
        active: true,
      },
    });
    return toCouponDto(created);
  },

  async setCouponActive(id: string, active: boolean) {
    try {
      const updated = await prisma.coupon.update({
        where: { id },
        data: { active },
      });
      return toCouponDto(updated);
    } catch {
      throw new NotFoundError('Cupom não encontrado');
    }
  },
};
