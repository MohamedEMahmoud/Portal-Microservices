import express from 'express';
import {
  createReview,
  updateReview,
  deleteReview,
  getReviews,
} from './review.controller';
import { requireAuth, upload } from '@portal-microservices/common';

const router = express.Router();

router.post('/api/commerce/review', upload.none(), requireAuth, createReview);

router.get('/api/commerce/reviews', upload.none(), requireAuth, getReviews);

router.patch('/api/commerce/review', upload.none(), requireAuth, updateReview);

router.delete('/api/commerce/review', upload.none(), requireAuth, deleteReview);

export { router as reviewRouter };
