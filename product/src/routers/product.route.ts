import express from 'express';
import {
  createNewProduct,
  getProduct,
  getAllProductForMerchantId,
  getProducts,
  deleteProduct,
  deleteAllProduct,
  updateProduct,
  searchProduct,
} from '../controllers/product.controller';
import {
  requireAuth,
  upload,
  validationPhoto,
} from '@portal-microservices/common';

const router = express.Router();

router.post(
  '/api/product',
  upload.fields([
    { name: 'images', maxCount: 4 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  validationPhoto,
  requireAuth,
  createNewProduct
);

router.get('/api/product', upload.none(), requireAuth, getProduct);

router.get('/api/product/search', upload.none(), requireAuth, searchProduct);

router.get(
  '/api/product/merchantId',
  upload.none(),
  requireAuth,
  getAllProductForMerchantId
);

router.get('/api/product/all', upload.none(), requireAuth, getProducts);

router.patch(
  '/api/product',
  upload.fields([
    { name: 'images', maxCount: 4 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  validationPhoto,
  requireAuth,
  updateProduct
);

router.delete('/api/product', upload.none(), requireAuth, deleteProduct);

router.delete('/api/product/all', upload.none(), requireAuth, deleteAllProduct);

export { router as productsRouter };
