import { Router } from 'express';
import { couponController } from '../modules/coupons/coupon.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const couponRouter = Router();

couponRouter.post('/validar', authMiddleware, (req, res, next) => couponController.validateCoupon(req, res, next));

export default couponRouter;
