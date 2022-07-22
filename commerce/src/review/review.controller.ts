import { Request, Response } from 'express';
import { BadRequestError, LoggerService } from '@portal-microservices/common';
import mongoose from 'mongoose';
import _ from 'lodash';
import { Review } from './review.model';
import { Product } from '../product/product.model';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

/**
 * Create new review controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const createReview = async (req: Request, res: Response): Promise<void> => {
  if (!req.body) {
    logger.error("Can't not send Empty Request");
    throw new BadRequestError("Can't not send Empty Request");
  }

  const product = await Product.findOne({ id: req.query.productId });
  if (!product) {
    logger.info('product not found');
    throw new BadRequestError('product not found');
  }

  const review = Review.build({
    customer: req.currentUser!.id,
    product: product.id,
    ...req.body,
  });

  product.reviews.push(review);
  await product.save();

  await review.save();
  logger.info(`review : ${review.id} is created successfully`);
  res.status(201).send({ status: 201, review, sucess: true });
};

/**
 * Update review controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const updateReview = async (req: Request, res: Response): Promise<void> => {
  const review = await Review.findById(req.query.id);

  if (!review) {
    logger.error(`review is not found!`);
    throw new BadRequestError('review is not found!');
  }

  _.extend(review, req.body);
  await review.save();
  logger.info(`reviewId : ${review.id} is updated Successfully`);

  res.status(200).json({
    status: 200,
    review,
    message: 'Review Updated Successfully!',
    success: true,
  });
};

/**
 * Delete review controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const deleteReview = async (req: Request, res: Response): Promise<void> => {
  if (
    !req.query.reviewId ||
    !mongoose.Types.ObjectId.isValid(String(req.query.reviewId))
  ) {
    logger.error(`${req.query.reviewId} is invalid`);
    throw new BadRequestError('reviewId is invalid.');
  }

  const review = await Review.findById(req.query.reviewId);
  if (!review) {
    logger.error(`review is not found!`);
    throw new BadRequestError('review is not found!');
  }

  if (review.customer.toString() !== req.currentUser!.id) {
    logger.error('you can delete this your reviews only');
    throw new BadRequestError('you can delete this your reviews only');
  }

  await review.deleteOne();
  logger.info(`reviewId : ${review.id} is deleted successfully`);
  res.send({
    status: 204,
    message: 'Review has been deleted Successfully!',
    success: true,
  });
};

/**
 * Get all review for specific product controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getReviews = async (req: Request, res: Response): Promise<void> => {
  const count = await Review.find({
    product: req.query.productId,
  }).countDocuments();

  const currentPage: any = req.query.page || 1,
    perPage = 2;

  const reviews = await Review.find({ product: req.query.productId })
    .sort({ created_at: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  if (reviews.length === 0) {
    logger.error(`there is no reviews`);
    throw new BadRequestError('there is no reviews.');
  }

  logger.info(`${reviews}`);
  res
    .status(200)
    .send({ status: 200, reviews, totalItems: count, success: true });
};

export { createReview, updateReview, deleteReview, getReviews };
