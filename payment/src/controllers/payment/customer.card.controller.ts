import { Request, Response } from 'express';
import { BadRequestError, LoggerService } from '@portal-microservices/common';
import { stripe, Stripe } from '../../services/stripe';
import { CustomerCard } from '../../models/payment/customer.card.model';
import { User } from '../../models/user/user.model';
import { encrypt } from '../../services/encrypt.services';
import { Order, OrderDoc } from '../../models/order/order.model';
import { Payment } from '../../models/payment/payment.model';
import { Product, ProductDoc } from '../../models/product/product.model';
import { Account } from '../../models/payment/merchant.account.model';
import { MerchantCard } from '../../models/payment/merchant.card.model';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

const paymentCard = async (req: Request, res: Response) => {
  const user = await User.findById(req.currentUser!.id);
  const order = await Order.findOne({ customer: user!.id });

  if (!user) {
    logger.error('User not found');
    throw new BadRequestError('User not found');
  }

  const customers = await stripe.customers.list();
  const customerExist = customers.data.map((customer) =>
    customer.email === user.email ? true : false
  );

  if (customerExist.includes(true)) {
    await customerIsExist(req, res, order!, customers);
  } else {
    await customerIsNotExist(req, res, order!);
  }
};

const customerIsExist = async (
  req: Request,
  res: Response,
  order: OrderDoc,
  customers: Stripe.Response<Stripe.ApiList<Stripe.Customer>>
) => {
  let payment;
  const user = await User.findById(req.currentUser!.id);
  if (!user) {
    logger.error('User not found');
    throw new BadRequestError('User not found');
  }

  const paymentSaved = customers.data.map(async (customer) => {
    if (customer.email === user.email) {
      const charge = await stripe.charges.create({
        customer: customer.id,
        source: String(customer.default_source),
        amount: order.totalOrderPrice * 100,
        currency: req.body.currency,
      });

      if (charge.paid && charge.status === 'succeeded') {
        payment = Payment.build({
          orderId: order.id,
          stripeId: charge.id,
          paymentMethodType: 'card',
          paidAt: new Date(Date.now()),
          paid: charge.paid,
          price: order.totalOrderPrice,
          customer: customer.id,
          status: charge.status,
        });

        return await payment.save();
      }
    }
  });

  if (paymentSaved) {
    order.cartItems.map(async (item) => {
      let product = await Product.findById(item.product);

      await stripe.products.create({
        name: product!.title,
        description: product!.description,
        images: [product!.images[0].URL],
      });

      await stripe.prices.create({
        unit_amount: item.price * 100,
        currency: req.body.currency,
        product: item.product,
      });

      const merchant = await User.findOne({ id: product!.merchantId });
      const accounts = await stripe.accounts.list({ limit: 100 });
      const accountExist = accounts.data.map((account) =>
        account.email === merchant!.email ? true : false
      );

      if (accountExist.includes(true)) {
        accounts.data.map(async (account) => {
          if (account.email === merchant!.email) {
            await transferMoneyToInstructors(order, product!, account);
          }
        });
      }
    });
  }

  res.status(201).send({
    status: 201,
    message: 'paid Successful',
    payment,
    success: true,
  });
};

const customerIsNotExist = async (
  req: Request,
  res: Response,
  order: OrderDoc
) => {
  const user = await User.findById(req.currentUser!.id);
  if (!user) {
    logger.error('User not found');
    throw new BadRequestError('User not found');
  }

  let card = {
    number: req.body.number,
    exp_month: req.body.exp_month,
    exp_year: req.body.exp_year,
    cvc: req.body.cvc,
  };

  const stripeToken = await stripe.tokens.create({ card });

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.username,
    source: stripeToken.id,
  });

  order.cartItems.map(async (item) => {
    let product = await Product.findById(item.product);

    await stripe.products.create({
      name: product!.title,
      description: product!.description,
      images: [product!.images[0].URL],
    });

    await stripe.prices.create({
      unit_amount: item.price * 100,
      currency: req.body.currency,
      product: item.product,
    });
  });

  const charge = await stripe.charges.create({
    customer: customer.id,
    source: String(customer.default_source),
    amount: order.totalOrderPrice * 100,
    currency: req.body.currency,
  });

  if (charge.paid && charge.status === 'succeeded') {
    const customerCard = CustomerCard.build({
      customer: user.id,
      number: encrypt(req.body.number),
      exp_month: String(charge.payment_method_details!.card!.exp_month),
      exp_year: String(charge.payment_method_details!.card!.exp_year),
      cvc: encrypt(req.body.cvc),
      last4: String(charge.payment_method_details!.card!.last4),
      brand: 'charge.source!.brand',
      country: String(charge.payment_method_details!.card!.country),
      stripeCardId: String(charge.payment_method),
      stripeCustomerId: String(charge.customer),
      clientIp: String(stripeToken.client_ip),
      token: [String(stripeToken)],
    });

    await customerCard.save();

    const paymentSaved = Payment.build({
      orderId: order.id,
      stripeId: charge.id,
      paymentMethodType: 'card',
      paidAt: new Date(Date.now()),
      paid: charge.paid,
      price: order.totalOrderPrice,
      customer: customer.id,
      status: charge.status,
    });

    if (paymentSaved) {
      order.cartItems.map(async (item) => {
        let product = await Product.findById(item.product);

        await stripe.products.create({
          name: product!.title,
          description: product!.description,
          images: [product!.images[0].URL],
        });

        await stripe.prices.create({
          unit_amount: item.price * 100,
          currency: req.body.currency,
          product: item.product,
        });

        const merchant = await User.findOne({ id: product!.merchantId });
        const accounts = await stripe.accounts.list({ limit: 100 });
        const accountExist = accounts.data.map((account) =>
          account.email === merchant!.email ? true : false
        );

        if (accountExist.includes(true)) {
          accounts.data.map(async (account) => {
            if (account.email === merchant!.email) {
              await transferMoneyToInstructors(order, product!, account);
            }
          });
        }
      });
    }
  }

  res.status(201).send({
    status: 201,
    payment: 'paid Successful',
    success: true,
  });
};

const transferMoneyToInstructors = async (
  order: OrderDoc,
  product: ProductDoc,
  account: Stripe.Account
) => {
  const transfer = await stripe.transfers.create({
    amount: (order.totalOrderPrice * 100) / 2,
    currency: 'usd',
    destination: account.id,
  });

  if (transfer) {
    await saveTransfer(transfer, product);
  }
};

const saveTransfer = async (
  transfer: Stripe.Response<Stripe.Transfer>,
  product: ProductDoc
) => {
  const merchantBankAccount = await Account.findOne({
    merchant: product.merchantId,
  });

  const merchantCard = await MerchantCard.findOne({
    merchant: product.merchantId,
  });

  if (
    merchantBankAccount &&
    transfer.destination === merchantBankAccount.stripeAccountId
  ) {
    merchantBankAccount.transfer = [...merchantBankAccount.transfer, transfer];
    await merchantBankAccount.save();
  }

  if (merchantCard && transfer.destination === merchantCard.stripeAccountId) {
    merchantCard.transfer = [...merchantCard.transfer, transfer];
    await merchantCard.save();
  }
};

export { paymentCard };
