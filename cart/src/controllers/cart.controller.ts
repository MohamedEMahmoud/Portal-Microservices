import { Request, Response } from 'express';
import {
  BadRequestError,
  LoggerService,
  RolesType,
} from '@portal-microservices/common';
import { Product } from '../models/product.model';
import _ from 'lodash';
import fs from 'fs';
import { User } from '../models/user.model';
import { Cart } from '../models/cart.model';
import { Coupon } from '../models/coupon.model';
import { CartCreatedPublisher } from '../events/publishers/cart-created-publisher';
import { CartUpdatedPublisher } from '../events/publishers/cart-updated-publisher';
import { CartDeletedPublisher } from '../events/publishers/cart-deleted-publisher';
import { natsWrapper } from '../nats-wrapper';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

const calcTotalCartPrice = (cart: {
  totalCartPrice: number;
  totalPriceAfterDiscount: number | undefined;
  cartItems: { product: string; quantity: number; price: number }[];
}) => {
  let totalPrice = 0;
  cart.cartItems.forEach((item: { quantity: number; price: number }) => {
    totalPrice += item.quantity * item.price;
  });

  cart.totalCartPrice = totalPrice;
  cart.totalPriceAfterDiscount = undefined;
  return totalPrice;
};

/**
 * Add product to cart controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const addProductToCart = async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.query;
  const product = await Product.findById(productId);

  if (!product) {
    logger.error('product not found.');
    throw new BadRequestError('product not found.');
  }

  let cart;
  cart = await Cart.findOne({ customer: req.currentUser!.id });
  if (!cart) {
    cart = Cart.build({
      customer: req.currentUser!.id,
      cartItems: [{ product: product.id, price: product.price }],
    });
  } else {
    const productIndex = cart.cartItems.findIndex((item) => {
      return item.product.toString() === productId;
    });

    if (productIndex > -1) {
      cart.cartItems[productIndex].quantity += 1;
    } else {
      cart.cartItems.push({
        product: product.id,
        price: product.price,
        quantity: 1,
      });
    }
  }

  // Calculate total cart price
  calcTotalCartPrice(cart);
  const cartData = await cart.save();
  if (cartData) {
    await new CartCreatedPublisher(natsWrapper.client).publish({
      id: cartData.id,
      customer: cartData.customer,
      cartItems: cartData.cartItems,
      totalCartPrice: cartData.totalCartPrice,
      version: cartData.version,
    });
  }

  logger.info(
    `'Product added to cart successfully for user ${req.currentUser!.id}`
  );

  res.status(201).json({
    status: 201,
    message: 'Product added to cart successfully',
    numOfCartItems: cart!.cartItems.length,
    data: cart,
    success: true,
  });
};

/**
 * Update specific cart item quantity controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const updateCartItemQuantity = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { quantity } = req.body;

  let cart;
  cart = await Cart.findOne({ customer: req.currentUser!.id });
  if (!cart) {
    logger.error(`there is no cart for user ${req.currentUser!.id}`);
    throw new BadRequestError(
      `there is no cart for user ${req.currentUser!.id}`
    );
  }

  const itemIndex = cart.cartItems.findIndex((item) => {
    return item.product.toString() === req.query.productId;
  });

  if (itemIndex > -1) {
    cart.cartItems[itemIndex].quantity += Number(quantity);
  } else {
    logger.error(`there is no product for this id :${req.query.productId}`);
    throw new BadRequestError(
      `there is no product for this id :${req.query.productId}`
    );
  }

  calcTotalCartPrice(cart);

  const cartData = await cart.save();

  if (cartData) {
    const bodyData: { [key: string]: string } = {};

    _.each(req.body, (value, key: string) => {
      const fields = ['cartItems', 'totalCartPrice', 'totalPriceAfterDiscount'];
      fields.forEach((el) => {
        if (key === el) {
          bodyData[key] = value;
        }
      });
    });

    await new CartUpdatedPublisher(natsWrapper.client).publish({
      id: cartData.id,
      version: cartData.version,
      ...bodyData,
    });
  }

  logger.info(`Cart Updated Successfully for user : ${req.currentUser!.id}`);

  res.status(200).json({
    status: 200,
    numOfCartItems: cart.cartItems.length,
    data: cart,
    success: true,
  });
};

/**
 * clear logged user cart controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const clearCart = async (req: Request, res: Response): Promise<void> => {
  const cartData = await Cart.findOneAndDelete({
    customer: req.currentUser!.id,
  });
  if (cartData) {
    await new CartDeletedPublisher(natsWrapper.client).publish({
      id: cartData.id,
    });
  }
  logger.info(`Cart Deleted Successfully for user : ${req.currentUser!.id}`);
  res
    .status(204)
    .json({ status: 204, message: 'Cart Deleted Successfully', success: true });
};

/**
 * Remove specific cart item controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const removeSpecificProductFromCartItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  let cart = await Cart.findOneAndUpdate(
    { customer: req.currentUser!.id },
    { $pull: { cartItems: { product: req.query.productId } } },
    { new: true }
  );

  calcTotalCartPrice(cart!);
  const cartData = await cart!.save();

  if (cartData) {
    const bodyData: { [key: string]: string } = {};

    _.each(req.body, (value, key: string) => {
      const fields = ['cartItems', 'totalCartPrice', 'totalPriceAfterDiscount'];
      fields.forEach((el) => {
        if (key === el) {
          bodyData[key] = value;
        }
      });
    });

    await new CartUpdatedPublisher(natsWrapper.client).publish({
      id: cartData.id,
      version: cartData.version,
      ...bodyData,
    });
  }

  logger.info(`item : ${req.query.itemId} is removed successfully from cart`);
  res.status(200).json({
    status: 200,
    numOfCartItems: cart!.cartItems.length,
    data: cart,
    success: true,
  });
};

/**
 *  Get ser cart controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getUserCart = async (req: Request, res: Response): Promise<void> => {
  let cart = await Cart.findOne({ customer: req.currentUser!.id });

  if (!cart) {
    logger.error(`there is no cart for user ${req.currentUser!.id}`);
    throw new BadRequestError(
      `there is no cart for user ${req.currentUser!.id}`
    );
  }

  res.status(200).json({
    status: 200,
    numOfCartItems: cart.cartItems.length,
    data: cart,
    success: true,
  });
};

/**
 *  Apply coupon on logged user cart controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const applyCoupon = async (req: Request, res: Response): Promise<void> => {
  let coupon = await Coupon.findOne({
    coupon: req.body.coupon,
    expire: { $gt: Date.now() },
  });

  if (!coupon) {
    logger.error(`Coupon : ${coupon} is invalid or expired`);
    throw new BadRequestError(`Coupon : ${coupon} is invalid or expired`);
  }

  let cart = await Cart.findOne({ customer: req.currentUser!.id });

  if (!cart) {
    logger.error(`there is no cart for user ${req.currentUser!.id}`);
    throw new BadRequestError(
      `there is no cart for user ${req.currentUser!.id}`
    );
  }

  const totalPrice = cart.totalCartPrice;

  const totalPriceAfterDiscount = (
    totalPrice -
    (totalPrice * coupon.discount) / 100
  ).toFixed(2);

  cart.totalPriceAfterDiscount = Number(totalPriceAfterDiscount);

  const cartData = await cart.save();

  if (cartData) {
    const bodyData: { [key: string]: string } = {};

    _.each(req.body, (value, key: string) => {
      const fields = ['cartItems', 'totalCartPrice', 'totalPriceAfterDiscount'];
      fields.forEach((el) => {
        if (key === el) {
          bodyData[key] = value;
        }
      });
    });

    await new CartUpdatedPublisher(natsWrapper.client).publish({
      id: cartData.id,
      version: cartData.version,
      ...bodyData,
    });
  }

  res.status(200).json({
    status: 200,
    numOfCartItems: cart!.cartItems.length,
    data: cart,
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
  addProductToCart,
  updateCartItemQuantity,
  clearCart,
  removeSpecificProductFromCartItem,
  getUserCart,
  applyCoupon,
  logReader,
};
