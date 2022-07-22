import { Request, Response } from 'express';
import { BadRequestError, LoggerService } from '@portal-microservices/common';
import { stripe, Stripe } from '../../services/stripe';
import { Account } from '../../models/payment/merchant.account.model';
import { MerchantCard } from '../../models/payment/merchant.card.model';
import { User } from '../../models/user/user.model';
import { encrypt, decrypt } from '../../services/encrypt.services';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

const createMerchantAccount = async (req: Request, res: Response) => {
  const merchant = await User.findById(req.currentUser!.id);
  if (!merchant) {
    logger.error('Merchant not found');
    throw new BadRequestError('Merchant not found');
  }

  const BankAccountOrDebitCard: any = async () => {
    if (req.body.account_number) {
      return {
        bank_account: {
          country: req.body.country,
          currency: req.body.currency,
          account_holder_name: merchant.username,
          account_holder_type: 'individual',
          routing_number: req.body.routing_number,
          account_number: req.body.account_number,
        },
      };
    }

    if (req.body.number) {
      return {
        card: {
          number: req.body.number,
          exp_month: req.body.exp_month,
          exp_year: req.body.exp_year,
          currency: req.body.currency,
        },
      };
    }
  };

  const token = await stripe.tokens.create(BankAccountOrDebitCard());

  let account: Stripe.Response<Stripe.Account>;
  account = await stripe.accounts.create({
    business_type: 'individual',
    business_profile: {
      support_email: merchant.email,
      support_url: req.body.support_url,
      // todo: add user profile link in 'url'
      url: 'https://portal-microservices.dev/',
    },
    country: req.body.country,
    default_currency: req.body.currency,
    email: merchant.email,
    external_account: req.body.account_number ? token.id : undefined,
    type: 'express',
  });

  let card: Stripe.Response<Stripe.BankAccount | Stripe.Card> | undefined;

  if (!req.body.account_number && req.body.number) {
    card = await stripe.accounts.createExternalAccount(account.id, {
      external_account: req.body.number ? token.id : String(undefined),
    });
  }

  let accountId = account.id;

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'https://portal-microservices.dev/', // The URL that the user will be redirected to if the account link is no longer valid
    return_url: `https://portal-microservices.dev/active/account?accountId=${accountId}`, // The URL that the user will be redirected to upon leaving or finish activation
    type: 'account_onboarding',
  });

  if (account) {
    if (req.body.account_number && req.body.routing_number) {
      account.external_accounts!.data.map(async (bankAccount) => {
        const bank_account = Account.build({
          merchant: merchant.id,
          account_number: encrypt(req.body.account_number),
          // routing_number: bankAccount.routing_number,
          // bank_name: bankAccount.bank_name,
          routing_number: 12345,
          bank_name: 'bankAccount.bank_name',
          last4: bankAccount.last4,
          country: bankAccount.country!,
          currency: bankAccount.currency!,
          capabilities: account.capabilities!.transfers!,
          stripeBankAccountId: bankAccount.id,
          stripeAccountId: String(bankAccount.account),
          clientIp: token.client_ip!,
          account_link_url: accountLink.url,
          token: [String(token)],
        });
        await bank_account.save();
      });
    }
  } else {
    const cardMerchant = MerchantCard.build({
      merchant: merchant.id,
      number: encrypt(req.body.number),
      // exp_month: card!.exp_month,
      // exp_year: card!.exp_year,
      // brand: card!.brand,
      // capabilities: account.capabilities.transfers,
      exp_month: 'card!.exp_month',
      exp_year: 'card!.exp_year',
      brand: 'card!.brand',
      capabilities: 'account.capabilities.transfers',
      last4: card!.last4,
      country: String(card!.country),
      currency: String(card!.currency),
      stripeCardId: card!.id,
      stripeAccountId: String(card!.account),
      clientIp: token.client_ip!,
      account_link_url: accountLink.url,
      token: [String(token)],
      cvc: encrypt(req.body.cvc),
    });
    await cardMerchant.save();
  }

  res.status(201).send({
    status: 201,
    accountLink: accountLink.url,
    merchant,
    success: true,
  });
};

const getMerchantCard = async (req: Request, res: Response) => {
  const card = await MerchantCard.findOne({
    merchant: req.currentUser!.id,
  }).populate({ path: 'merchant' });

  let data;
  if (card) {
    data = {
      card,
      number: decrypt(card.number),
    };
  }

  res.status(200).send({ status: 200, card: data, success: true });
};

const getMerchantAccount = async (req: Request, res: Response) => {
  const bank_account = await Account.findOne({
    merchant: req.currentUser!.id,
  }).populate({ path: 'merchant' });

  let data;
  if (bank_account) {
    data = {
      bank_account,
      number: decrypt(bank_account.account_number),
    };
  }

  res.status(200).send({ status: 200, card: data, success: true });
};

const activeMerchantAccount = async (req: Request, res: Response) => {
  const card = await MerchantCard.findOne({ merchant: req.currentUser!.id });
  const bank_account = await Account.findOne({ merchant: req.currentUser!.id });

  if (card) {
    card.capabilities = 'active';
    await card.save();
    res.status(200).send({
      status: 200,
      message: 'Account activated successfully',
      success: true,
    });
  }

  if (bank_account) {
    bank_account.capabilities = 'active';
    await bank_account.save();
    res.status(200).send({
      status: 200,
      message: 'Account activated successfully',
      success: true,
    });
  }
};

export {
  createMerchantAccount,
  getMerchantCard,
  getMerchantAccount,
  activeMerchantAccount,
};
