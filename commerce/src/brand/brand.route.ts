import express from 'express';
import {
  createBrand,
  updateBrand,
  deleteBrand,
  getBrands,
} from './brand.controller';
import {
  requireAuth,
  upload,
  validationPhoto,
} from '@portal-microservices/common';

const router = express.Router();

router.post(
  '/api/commerce/brand',
  upload.fields([{ name: 'logo', maxCount: 1 }]),
  validationPhoto,
  requireAuth,
  createBrand
);

router.get('/api/commerce/brands', upload.none(), requireAuth, getBrands);

router.patch(
  '/api/commerce/brand',
  upload.fields([{ name: 'logo', maxCount: 1 }]),
  validationPhoto,
  requireAuth,
  updateBrand
);

router.delete('/api/commerce/brand', upload.none(), requireAuth, deleteBrand);

export { router as brandRouter };
