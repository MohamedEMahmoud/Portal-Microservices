import express from 'express';
import { getInvoice } from '../../controllers/order/order-invoice.controller';
import { requireAuth, upload } from '@portal-microservices/common';

const router = express.Router();

router.get(
  '/api/payment/order/invoice',
  upload.none(),
  requireAuth,
  getInvoice
);

export { router as orderRouter };
