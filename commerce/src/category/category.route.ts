import express from 'express';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
} from './category.controller';
import {
  requireAuth,
  upload,
  validationPhoto,
} from '@portal-microservices/common';

const router = express.Router();

router.post(
  '/api/commerce/category',
  upload.fields([{ name: 'image', maxCount: 1 }]),
  validationPhoto,
  requireAuth,
  createCategory
);

router.get(
  '/api/commerce/categories',
  upload.none(),
  requireAuth,
  getCategories
);

router.patch(
  '/api/commerce/category',
  upload.fields([{ name: 'image', maxCount: 1 }]),
  validationPhoto,
  requireAuth,
  updateCategory
);

router.delete(
  '/api/commerce/category',
  upload.none(),
  requireAuth,
  deleteCategory
);

export { router as categoryRouter };
