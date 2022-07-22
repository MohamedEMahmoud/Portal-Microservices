import express from 'express';
import { paymentCard } from '../../controllers/payment/customer.card.controller';
import { requireAuth, upload } from '@portal-microservices/common';

const router = express.Router();

router.post('/api/payment/customer', upload.none(), requireAuth, paymentCard);

export { router as paymentCardRouter };
