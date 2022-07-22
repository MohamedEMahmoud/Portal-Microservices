import { Request, Response } from 'express';
import {
  BadRequestError,
  LoggerService,
  RolesType,
} from '@portal-microservices/common';
import { v2 as Cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import _ from 'lodash';
import slugify from 'slugify';
import { Brand } from './brand.model';
import { User } from '../user/user.model';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

/**
 * Create new brand controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const createBrand = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!req.body) {
    logger.error("Can't not send Empty Request");
    throw new BadRequestError("Can't not send Empty Request");
  }

  const user = await User.findById(req.currentUser!.id);
  if (user?.role === RolesType.Customer) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  const newBrand = Brand.build({
    ...req.body,
  });

  newBrand.slug = slugify(req.body.name, {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
  });

  const brandExist = await Brand.findOne({ slug: newBrand.slug });
  if (brandExist) {
    throw new BadRequestError(
      `Category : ${brandExist.slug} is already exists`
    );
  }

  if (files.logo) {
    await new Promise((resolve, reject) => {
      Cloudinary.uploader
        .upload_stream(
          {
            public_id: `logo-brand/Portal-${newBrand.name}`,
            use_filename: true,
            tags: `${newBrand.name}-tag`,
            width: 500,
            height: 500,
            crop: 'scale',
            placeholder: true,
            resource_type: 'auto',
          },
          async (err, result) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              newBrand.logo = result?.secure_url!;
              resolve(newBrand!.logo);
            }
          }
        )
        .end(files.logo[0].buffer);
    });
  }

  await newBrand.save();
  logger.info(`${newBrand.name} is created successfully`);
  res.status(201).json({
    status: 201,
    newBrand,
    message: 'Brand created Successfully!',
    success: true,
  });
};

/**
 * Update brand controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const updateBrand = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const brand = await Brand.findById(req.query.id);

  if (!brand) {
    logger.error(`brand is not found!`);
    throw new BadRequestError('brand is not found!');
  }

  const user = await User.findById(req.currentUser!.id);
  if (user?.role === RolesType.Customer) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  if (files.logo) {
    await new Promise((resolve, reject) => {
      Cloudinary.uploader
        .upload_stream(
          {
            public_id: `logo-brand/Portal-${brand.name}`,
            use_filename: true,
            tags: `${brand.name}-tag`,
            width: 500,
            height: 500,
            crop: 'scale',
            placeholder: true,
            resource_type: 'auto',
          },
          async (err, result) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              brand.logo = result?.secure_url!;
              resolve(brand!.logo);
            }
          }
        )
        .end(files.image[0].buffer);
    });
  }

  _.extend(brand, req.body);

  brand.slug = slugify(req.body.name, {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
  });

  await brand.save();
  logger.info(`brandId : ${brand.id} is updated Successfully`);

  res.status(200).json({
    status: 200,
    brand,
    message: 'Brand Updated Successfully!',
    success: true,
  });
};

/**
 * Delete brand controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const deleteBrand = async (req: Request, res: Response): Promise<void> => {
  if (
    !req.query.brandId ||
    !mongoose.Types.ObjectId.isValid(String(req.query.brandId))
  ) {
    logger.error(`${req.query.brandId} is invalid`);
    throw new BadRequestError('brandId is invalid.');
  }

  const user = await User.findById(req.currentUser!.id);
  if (user?.role === RolesType.Customer) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  const brand = await Brand.findById(req.query.brandId);
  if (!brand) {
    logger.error(`brand is not found!`);
    throw new BadRequestError('brand is not found!');
  }

  await brand.deleteOne();
  logger.info(`brandId : ${brand.id} is deleted successfully`);
  res.send({
    status: 204,
    message: 'Brand has been deleted Successfully!',
    success: true,
  });
};

/**
 * Get all brands controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getBrands = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.currentUser!.id);
  if (user?.role === RolesType.Customer) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  const count = await Brand.find({}).countDocuments();

  const currentPage: any = req.query.page || 1,
    perPage = 2;
  const brands = await Brand.find({})
    .sort({ created_at: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  if (brands.length === 0) {
    logger.error(`there is no brands`);
    throw new BadRequestError('there is no brands.');
  }

  logger.info(`${brands}`);
  res
    .status(200)
    .send({ status: 200, brands, totalItems: count, success: true });
};

export { createBrand, updateBrand, deleteBrand, getBrands };
