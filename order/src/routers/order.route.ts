import express from 'express';
import {
  createOrder,
  updateOrder,
  showOrders,
  showSpecificOrder,
  deleteOrder,
  logReader,
} from '../controllers/order.controller';
import { requireAuth, upload } from '@portal-microservices/common';

const router = express.Router();

router.post('/api/order', upload.none(), requireAuth, createOrder);

router.patch('/api/order', upload.none(), requireAuth, updateOrder);

router.delete('/api/order', upload.none(), requireAuth, deleteOrder);

router.get('/api/order/all', upload.none(), requireAuth, showOrders);

router.get('/api/order', upload.none(), requireAuth, showSpecificOrder);

router.get('/api/order/logger-data', upload.none(), requireAuth, logReader);

export { router as orderRouter };
