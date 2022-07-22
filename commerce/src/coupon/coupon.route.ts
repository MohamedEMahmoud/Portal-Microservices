import express from 'express';
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCoupons,
  checkCouponExpire,
} from './coupon.controller';
import { requireAuth, upload } from '@portal-microservices/common';

const router = express.Router();

router.post('/api/commerce/coupon', upload.none(), requireAuth, createCoupon);

router.get('/api/commerce/coupons', upload.none(), requireAuth, getCoupons);

router.patch('/api/commerce/coupon', upload.none(), requireAuth, updateCoupon);

router.delete('/api/commerce/coupon', upload.none(), requireAuth, deleteCoupon);

router.post(
  '/api/commerce/check-coupon-expire',
  upload.none(),
  requireAuth,
  checkCouponExpire
);

export { router as couponRouter };
