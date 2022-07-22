import { WishList } from '../models/wishlist.model';
import { Product } from '../models/product.model';
import { BadRequestError, LoggerService } from '@portal-microservices/common';
import { Request, Response } from 'express';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

/**
 * Add product to wishlist controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const addProductToWishlist = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { productId } = req.query;
  const product = await Product.findById(productId);
  if (!product) {
    logger.error(`product with this id : ${productId} is not found`);
    throw new BadRequestError(
      `product with this id : ${productId} is not found`
    );
  }

  let user;
  user = await WishList.findOneAndUpdate(
    { customer: req.currentUser!.id },
    { $addToSet: { wishlist: product.id } },
    { new: true }
  );

  if (!user) {
    user = WishList.build({
      customer: req.currentUser!.id,
      wishlist: [product.id],
    });
    await user!.save();
  }
  logger.info(
    `product with this id : ${productId} added successfully to your wishlist.`
  );

  res.status(200).json({
    status: 200,
    message: 'Product added successfully to your wishlist.',
    success: true,
  });
};

/**
 * Remove product from wishlist controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const removeProductFromWishlist = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { productId } = req.query;
  const product = await Product.findById(productId);
  if (!product) {
    logger.error(`product with this id : ${productId} is not found`);
    throw new BadRequestError(
      `product with this id : ${productId} is not found`
    );
  }

  let user;

  user = await WishList.findOne({ customer: req.currentUser!.id });

  user!.wishlist = user!.wishlist.filter(
    (items) => items.toString() !== product.id
  );

  await user!.save();

  logger.info(
    `product with this id : ${productId} removed successfully from your wishlist.`
  );

  res.status(200).json({
    status: 200,
    message: 'Product removed successfully from your wishlist.',
    data: user!.wishlist,
    success: true,
  });
};

/**
 * getLoggedUserWishlist controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getLoggedUserWishlist = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = await WishList.find({ customer: req.currentUser!.id }).populate({
    path: 'wishlist',
    select: '-merchantId -images -version -created_at -updated_at',
  });

  logger.info(`${user[0]!.wishlist}`);
  res.status(200).json({
    status: 200,
    length: user[0]!.wishlist.length,
    data: user[0]!.wishlist,
    success: true,
  });
};

export {
  addProductToWishlist,
  getLoggedUserWishlist,
  removeProductFromWishlist,
};
