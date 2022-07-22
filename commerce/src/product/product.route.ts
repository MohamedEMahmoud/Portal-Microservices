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
  logReader,
  getOneProductForMerchantId,
  getRelatedProducts,
} from './product.controller';
import {
  requireAuth,
  upload,
  validationPhoto,
} from '@portal-microservices/common';

const router = express.Router();

router.post(
  '/api/commerce',
  upload.fields([
    { name: 'images', maxCount: 4 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  validationPhoto,
  requireAuth,
  createNewProduct
);

router.get('/api/commerce', upload.none(), requireAuth, getProduct);

router.get('/api/commerce/search', upload.none(), requireAuth, searchProduct);

router.get(
  '/api/commerce/merchantId/title',
  upload.none(),
  requireAuth,
  getAllProductForMerchantId
);

router.get(
  '/api/commerce/merchantId',
  upload.none(),
  requireAuth,
  getOneProductForMerchantId
);

router.get('/api/commerce/all', upload.none(), requireAuth, getProducts);

router.get('/api/commerce/logger', upload.none(), requireAuth, logReader);

router.patch(
  '/api/commerce',
  upload.fields([
    { name: 'images', maxCount: 4 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  validationPhoto,
  requireAuth,
  updateProduct
);

router.delete('/api/commerce', upload.none(), requireAuth, deleteProduct);

router.delete(
  '/api/commerce/all',
  upload.none(),
  requireAuth,
  deleteAllProduct
);

router.get(
  '/api/commerce/get-related-products',
  upload.none(),
  requireAuth,
  getRelatedProducts
);

export { router as productsRouter };
