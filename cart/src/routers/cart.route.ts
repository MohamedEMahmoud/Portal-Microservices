import express from 'express';
import {
  addProductToCart,
  updateCartItemQuantity,
  removeSpecificProductFromCartItem,
  clearCart,
  getUserCart,
  applyCoupon,
  logReader,
} from '../controllers/cart.controller';
import { requireAuth, upload } from '@portal-microservices/common';

const router = express.Router();

router.post('/api/cart', upload.none(), requireAuth, addProductToCart);

router.patch('/api/cart', upload.none(), requireAuth, updateCartItemQuantity);

router.delete('/api/cart', upload.none(), requireAuth, clearCart);

router.delete(
  '/api/cart-item',
  upload.none(),
  requireAuth,
  removeSpecificProductFromCartItem
);

router.get('/api/cart', upload.none(), requireAuth, getUserCart);

router.post('/api/cart/apply-coupon', upload.none(), requireAuth, applyCoupon);

router.get('/api/cart/logger-data', upload.none(), requireAuth, logReader);

export { router as cartRouter };
