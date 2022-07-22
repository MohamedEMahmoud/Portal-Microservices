import express from 'express';
import {
  createMerchantAccount,
  getMerchantAccount,
  getMerchantCard,
  activeMerchantAccount,
} from '../../controllers/payment/merchant.controller';
import { requireAuth, upload } from '@portal-microservices/common';

const router = express.Router();

router.post(
  '/merchant/account',
  upload.none(),
  requireAuth,
  createMerchantAccount
);

router.get('/merchant/account', upload.none(), requireAuth, getMerchantAccount);

router.get('/merchant/card', upload.none(), requireAuth, getMerchantCard);

router.patch(
  '/merchant/account/activate',
  upload.none(),
  requireAuth,
  activeMerchantAccount
);

export { router as paymentRouter };
