import { Request, Response } from 'express';
import {
  BadRequestError,
  LoggerService,
  RolesType,
} from '@portal-microservices/common';
import mongoose from 'mongoose';
import _ from 'lodash';
import { Coupon } from './coupon.model';
import { User } from '../user/user.model';
import moment from 'moment';
import { CouponCreatedPublisher } from '../events/publishers/coupon/coupon-created-publisher';
import { natsWrapper } from '../nats-wrapper';
import { CouponUpdatedPublisher } from '../events/publishers/coupon/coupon-updated-publisher';
import { CouponDeletedPublisher } from '../events/publishers/coupon/coupon-deleted-publisher';

function generate_random_string(string_length: number) {
  let random_string = '';
  let random_ascii;
  for (let i = 0; i < string_length; i++) {
    random_ascii = Math.floor(Math.random() * 25 + 97);
    random_string += String.fromCharCode(random_ascii);
  }
  return random_string.toUpperCase();
}

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

/**
 * Create new coupon controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const createCoupon = async (req: Request, res: Response): Promise<void> => {
  if (!req.body) {
    logger.error("Can't not send Empty Request");
    throw new BadRequestError("Can't not send Empty Request");
  }

  const user = await User.findById(req.currentUser!.id);
  if (user?.role !== RolesType.Admin) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  const generatedCoupon = generate_random_string(8);

  const coupon = Coupon.build({
    coupon: generatedCoupon,
    admin: user?.id,
    ...req.body,
  });

  let num, str;
  if (req.body.time) {
    num = parseInt(req.body.time.match(/\d+/)[0]);
    str = req.body.time.replace(num, '');
    str === 'd' ? (str = 'days') : (str = 'months');
  }

  coupon.expire = moment()
    .add(num, <moment.unitOfTime.DurationConstructor>str)
    .format();

  const couponData = await coupon.save();
  if (couponData) {
    await new CouponCreatedPublisher(natsWrapper.client).publish({
      id: couponData.id,
      admin: couponData.admin,
      coupon: couponData.coupon,
      expire: couponData.expire,
      discount: couponData.discount,
      version: couponData.version,
    });
  }
  logger.info(`coupon : ${coupon.id} is created successfully`);
  res.status(201).send({ status: 201, coupon, sucess: true });
};

/**
 * Update category controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.currentUser!.id);
  if (user?.role !== RolesType.Admin) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }
  const coupon = await Coupon.findById(req.query.id);

  if (!coupon) {
    logger.error(`coupon is not found!`);
    throw new BadRequestError('coupon is not found!');
  }

  _.extend(coupon, req.body);
  const couponData = await coupon.save();
  if (couponData) {
    const bodyData: { [key: string]: string } = {};

    _.each(req.body, (value, key: string) => {
      const fields = ['expire', 'discount'];
      fields.forEach((el) => {
        if (key === el) {
          bodyData[key] = value;
        }
      });
    });

    await new CouponUpdatedPublisher(natsWrapper.client).publish({
      id: couponData.id,
      version: couponData.version,
      ...bodyData,
    });
  }
  logger.info(`couponId : ${coupon.id} is updated Successfully`);

  res.status(200).json({
    status: 200,
    coupon,
    message: 'Coupon Updated Successfully!',
    success: true,
  });
};

/**
 * Delete category controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  if (
    !req.query.couponId ||
    !mongoose.Types.ObjectId.isValid(String(req.query.couponId))
  ) {
    logger.error(`${req.query.couponId} is invalid`);
    throw new BadRequestError('couponId is invalid.');
  }

  const user = await User.findById(req.currentUser!.id);
  if (user?.role !== RolesType.Admin) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  const coupon = await Coupon.findById(req.query.couponId);
  if (!coupon) {
    logger.error(`coupon is not found!`);
    throw new BadRequestError('coupon is not found!');
  }

  const couponData = await coupon.deleteOne();
  if (couponData) {
    await new CouponDeletedPublisher(natsWrapper.client).publish({
      id: couponData.id,
    });
  }
  logger.info(`couponId : ${coupon.id} is deleted successfully`);
  res.send({
    status: 204,
    message: 'Coupon has been deleted Successfully!',
    success: true,
  });
};

/**
 * Get all coupons controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getCoupons = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.currentUser!.id);
  if (user?.role !== RolesType.Admin) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  const count = await Coupon.find({}).countDocuments();

  const currentPage: any = req.query.page || 1,
    perPage = 2;
  const coupons = await Coupon.find({})
    .sort({ created_at: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  if (coupons.length === 0) {
    logger.error(`there is no coupons`);
    throw new BadRequestError('there is no coupons.');
  }

  logger.info(`${coupons}`);
  res
    .status(200)
    .send({ status: 200, coupons, totalItems: count, success: true });
};

const checkCouponExpire = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = await User.findById(req.currentUser!.id);
  if (user?.role !== RolesType.Admin) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  const coupon = await Coupon.findOne({ coupon: req.body.coupon });

  if (!coupon || new Date() > new Date(coupon.expire)) {
    logger.error('coupon is invalid');
    throw new Error('coupon is invalid');
  }

  res.status(200).send({ status: 200, coupon, success: true });
};

export {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCoupons,
  checkCouponExpire,
};
