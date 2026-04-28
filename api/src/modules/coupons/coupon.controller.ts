import { Response, NextFunction } from 'express';
import { couponService } from './coupon.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { CreateCouponInput, UpdateCouponActiveInput } from './coupon.schema';

export const couponController = {
  async validateCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;

      if (!code) {
        res.status(400).json({ status: 'error', message: 'Código de cupom não informado' });
        return;
      }

      const coupon = await couponService.validateCoupon(code);

      res.status(200).json({
        status: 'success',
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  },

  async listCoupons(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await couponService.listCoupons();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  },

  async createCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateCouponInput;
      const data = await couponService.createCoupon(body);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  },

  async setCouponActive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { active } = req.body as UpdateCouponActiveInput;
      const data = await couponService.setCouponActive(id, active);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  },
};
