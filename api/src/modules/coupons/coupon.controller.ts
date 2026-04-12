import { Response, NextFunction } from 'express';
import { couponService } from './coupon.service';
import { AuthRequest } from '../../middleware/auth.middleware';

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
};
