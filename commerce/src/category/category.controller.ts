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
import { Category } from './category.model';
import { User } from '../user/user.model';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

/**
 * Create new category controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const createCategory = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!req.body) {
    logger.error("Can't not send Empty Request");
    throw new BadRequestError("Can't not send Empty Request");
  }

  const user = await User.findById(req.currentUser!.id);
  if (user?.role !== RolesType.Admin) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  const newCategory = Category.build({
    ...req.body,
  });

  newCategory.slug = slugify(req.body.name, {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
  });

  const catExist = await Category.findOne({ slug: newCategory.slug });
  if (catExist) {
    throw new BadRequestError(
      `Category : ${newCategory.slug} is already exists`
    );
  }

  if (files.image) {
    await new Promise((resolve, reject) => {
      Cloudinary.uploader
        .upload_stream(
          {
            public_id: `image-category/Portal-${newCategory.name}`,
            use_filename: true,
            tags: `${newCategory.name}-tag`,
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
              newCategory.image = result?.secure_url!;
              resolve(newCategory!.image);
            }
          }
        )
        .end(files.image[0].buffer);
    });
  }

  await newCategory.save();
  logger.info(`${newCategory.name} is created successfully`);
  res.status(201).json({
    status: 201,
    newCategory,
    message: 'Category created Successfully!',
    success: true,
  });
};

/**
 * Update category controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const category = await Category.findById(req.query.id);

  if (!category) {
    logger.error(`category is not found!`);
    throw new BadRequestError('category is not found!');
  }

  const user = await User.findById(req.currentUser!.id);
  if (user?.role !== RolesType.Admin) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  if (files.image) {
    await new Promise((resolve, reject) => {
      Cloudinary.uploader
        .upload_stream(
          {
            public_id: `image-category/Portal-${category.name}`,
            use_filename: true,
            tags: `${category.name}-tag`,
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
              category.image = result?.secure_url!;
              resolve(category!.image);
            }
          }
        )
        .end(files.image[0].buffer);
    });
  }

  _.extend(category, req.body);

  category.slug = slugify(req.body.name, {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
  });

  await category.save();
  logger.info(`categoryId : ${category.id} is updated Successfully`);

  res.status(200).json({
    status: 200,
    category,
    message: 'Category Updated Successfully!',
    success: true,
  });
};

/**
 * Delete category controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  if (
    !req.query.categoryId ||
    !mongoose.Types.ObjectId.isValid(String(req.query.categoryId))
  ) {
    logger.error(`${req.query.categoryId} is invalid`);
    throw new BadRequestError('categoryId is invalid.');
  }

  const user = await User.findById(req.currentUser!.id);
  if (user?.role !== RolesType.Admin) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  const category = await Category.findById(req.query.categoryId);
  if (!category) {
    logger.error(`category is not found!`);
    throw new BadRequestError('category is not found!');
  }

  await category.deleteOne();
  logger.info(`categoryId : ${category.id} is deleted successfully`);
  res.send({
    status: 204,
    message: 'Category has been deleted Successfully!',
    success: true,
  });
};

/**
 * Get all categories controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getCategories = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.currentUser!.id);
  if (user?.role !== RolesType.Admin) {
    logger.error("you don't have permission to do this action");
    throw new BadRequestError("you don't have permission to do this action");
  }

  const count = await Category.find({}).countDocuments();

  const currentPage: any = req.query.page || 1,
    perPage = 2;
  const categories = await Category.find({})
    .sort({ created_at: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  if (categories.length === 0) {
    logger.error(`there is no categories`);
    throw new BadRequestError('there is no categories.');
  }

  logger.info(`${categories}`);
  res
    .status(200)
    .send({ status: 200, categories, totalItems: count, success: true });
};

export { createCategory, updateCategory, deleteCategory, getCategories };
