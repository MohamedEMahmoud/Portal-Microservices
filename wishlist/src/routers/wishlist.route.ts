import express from 'express';
import {
  addProductToWishlist,
  getLoggedUserWishlist,
  removeProductFromWishlist,
} from '../controllers/wishlist.controller';
import { requireAuth, upload } from '@portal-microservices/common';

const router = express.Router();

router.post('/api/wishlist', upload.none(), requireAuth, addProductToWishlist);

router.get('/api/wishlist', upload.none(), requireAuth, getLoggedUserWishlist);

router.delete(
  '/api/wishlist',
  upload.none(),
  requireAuth,
  removeProductFromWishlist
);

export { router as wishlistRouter };
