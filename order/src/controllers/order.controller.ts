import { Request, Response } from 'express';
import {
  BadRequestError,
  LoggerService,
  RolesType,
} from '@portal-microservices/common';
import _ from 'lodash';
import fs from 'fs';
import moment from 'moment';
import { User } from '../models/user.model';
import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { OrderCreatedPublisher } from '../events/publishers/order/order-creaated-publisher';
import { OrderUpdatedPublisher } from '../events/publishers/order/order-updated-publisher';
import { OrderDeletedPublisher } from '../events/publishers/order/order-deleted-publisher';
import { natsWrapper } from '../nats-wrapper';
import { OrderCartDeletedPublisher } from '../events/publishers/order/order-deleted-cart-publisher';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

/**
 *create new order controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const createOrder = async (req: Request, res: Response): Promise<void> => {
  const cart = await Cart.findById(req.query.cartId);
  if (!cart) {
    logger.error(`There is no such cart with id ${req.query.cartId}`);
    throw new BadRequestError(
      `There is no such cart with id ${req.query.cartId}`
    );
  }

  // Get order price depend on cart price "Check if coupon apply"
  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;

  const totalOrderPrice =
    cartPrice +
    Number(process.env.taxPrice) +
    Number(process.env.shippingPrice);

  const order = Order.build({
    customer: req.currentUser!.id,
    cartItems: cart.cartItems,
    totalOrderPrice,
    shippingAddress: req.body,
  });

  let start = moment(new Date());

  order.deliveredAt = start.add(5, 'days').toISOString();
  order.taxPrice = Number(process.env.taxPrice);
  order.shippingPrice = Number(process.env.shippingPrice);

  const orderData = await order.save();

  if (orderData) {
    await new OrderCreatedPublisher(natsWrapper.client).publish({
      id: orderData.id,
      customer: orderData.customer,
      cartItems: orderData.cartItems,
      totalOrderPrice: orderData.totalOrderPrice,
      shippingAddress: orderData.shippingAddress,
      deliveredAt: orderData.deliveredAt,
      version: orderData.version,
    });

    await new OrderCartDeletedPublisher(natsWrapper.client).publish({
      id: cart.id,
    });
  }
  logger.info(`Order Created Successfully for user ${req.currentUser!.id}`);

  res.status(201).json({
    status: 201,
    message: 'Order Created Successfully',
    data: order,
    success: true,
  });
};

/**
 * update order controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const updateOrder = async (req: Request, res: Response): Promise<void> => {
  const { orderId } = req.query;
  const order = await Order.findById(orderId);

  if (!order) {
    logger.error(`There is no such a order with this id:${orderId}`);
    throw new BadRequestError(
      `There is no such a order with this id:${orderId}`
    );
  }

  const user = await User.findById(req.currentUser!.id);
  if (user!.role !== RolesType.Admin) {
    logger.error(`u don't have permission to update orders`);
    throw new BadRequestError(`u don't have permission to update orders`);
  }

  if (req.body.taxPrice && req.body.shippingPrice) {
    order.totalOrderPrice =
      order.totalOrderPrice -
      (order.taxPrice + order.shippingPrice) +
      Number(req.body.taxPrice) +
      Number(req.body.shippingPrice);
  } else if (req.body.taxPrice) {
    order.totalOrderPrice =
      order.totalOrderPrice - order.taxPrice + Number(req.body.taxPrice);
  } else if (req.body.shippingPrice) {
    order.totalOrderPrice =
      order.totalOrderPrice -
      order.shippingPrice +
      Number(req.body.shippingPrice);
  } else {
    logger.error('u must update at least one taxPrice,shippingPrice');
    throw new BadRequestError(
      'u must update at least one taxPrice,shippingPrice'
    );
  }

  _.extend(order, req.body);

  const orderData = await order.save();

  if (orderData) {
    const bodyData: { [key: string]: string } = {};

    _.each(req.body, (value, key: string) => {
      const fields = ['taxPrice', 'shippingPrice'];
      fields.forEach((el) => {
        if (key === el) {
          bodyData[key] = value;
        }
      });
    });

    await new OrderUpdatedPublisher(natsWrapper.client).publish({
      id: orderData.id,
      ...bodyData,
      version: orderData.version,
    });
  }

  logger.info(`Order with id : ${orderId} is updated successfully...`);

  res.status(200).json({
    status: 200,
    message: 'Order Updated Successfully',
    data: order,
    success: true,
  });
};

/**
 * show specific order controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const showSpecificOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { orderId } = req.query;
  const order = await Order.findById(orderId);

  if (!order) {
    logger.error(`There is no such a order with this id:${orderId}`);
    throw new BadRequestError(
      `There is no such a order with this id:${orderId}`
    );
  }

  if (order.customer.toString() !== req.currentUser!.id) {
    logger.error('you can see only order created by you');
    throw new BadRequestError('you can see only order created by you');
  }

  logger.info(`Order with id : ${orderId} `);

  res.status(200).json({
    status: 200,
    data: order,
    success: true,
  });
};

/**
 * show orders for current user controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const showOrders = async (req: Request, res: Response): Promise<void> => {
  const orders = await Order.find({ customer: req.currentUser!.id });

  if (!orders) {
    logger.error('There is no orders for you');
    throw new BadRequestError('There is no orders for you');
  }

  logger.info(`Orders: ${orders} `);

  res.status(200).json({
    status: 200,
    data: orders,
    success: true,
  });
};

/**
 * delete order controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  const { orderId } = req.query;
  const order = await Order.findById(orderId);

  if (!order) {
    logger.error(`There is no such a order with this id:${orderId}`);
    throw new BadRequestError(
      `There is no such a order with this id:${orderId}`
    );
  }

  if (order.customer.toString() !== req.currentUser!.id) {
    logger.error(
      `you can't delete this order because this order not belong to you`
    );
    throw new BadRequestError(
      `you can't delete this order because this order not belong to you`
    );
  }

  logger.info(`Order with id : ${orderId} is deleted successfully`);

  const orderData = await order.deleteOne();

  if (orderData) {
    await new OrderDeletedPublisher(natsWrapper.client).publish({
      id: orderData.id,
    });
  }
  res.status(200).json({
    status: 200,
    message: 'Order Deleted Successfully',
    success: true,
  });
};

/**
 * Read logger files controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const logReader = async (req: Request, res: Response): Promise<void> => {
  let user = await User.findById(req.currentUser!.id);
  if (!user) {
    logger.error(`User is not found.`);
    throw new BadRequestError('User not found.');
  }

  if (user?.role !== RolesType.Admin) {
    logger.error(
      `${user.email} try to show logger file but he don't have permission.`
    );
    throw new BadRequestError("you don't have permission to do this action");
  }

  const data = fs
    .readFileSync(`${process.env.LOG_FILE_PATH}/${process.env.LOG_FILE_NAME}`, {
      encoding: 'utf8',
    })
    .split('\n')
    .filter((text) => text.length);

  res.send({
    status: 200,
    data,
    message: 'Successfully show logger file',
    success: true,
  });
};

export {
  createOrder,
  logReader,
  updateOrder,
  showSpecificOrder,
  showOrders,
  deleteOrder,
};
