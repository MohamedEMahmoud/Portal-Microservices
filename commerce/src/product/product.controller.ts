import { Request, Response } from 'express';
import {
  BadRequestError,
  LoggerService,
  RolesType,
} from '@portal-microservices/common';
import { Product } from './product.model';
import { v2 as Cloudinary } from 'cloudinary';
import { randomBytes } from 'crypto';
import mongoose from 'mongoose';
import _ from 'lodash';
import slugify from 'slugify';
import fs from 'fs';
import { User } from '../user/user.model';
import { Category } from '../category/category.model';
import { Brand } from '../brand/brand.model';
import { ProductCreatedPublisher } from '../events/publishers/product/product-created-publisher';
import { natsWrapper } from '../nats-wrapper';
import { ProductUpdatedPublisher } from '../events/publishers/product/product-updated-publisher';
import { ProductDeletedPublisher } from '../events/publishers/product/product-deleted-publisher';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

/**
 * Create new product controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const createNewProduct = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!req.body) {
    logger.error("Can't not send Empty Request");
    throw new BadRequestError("Can't not send Empty Request");
  }

  if (!req.body.price) {
    logger.error('price field is required.');
    throw new BadRequestError('price field is required.');
  }

  const newProduct = Product.build({
    ...req.body,
    merchantId: req.currentUser!.id,
  });

  newProduct.slug = slugify(req.body.title, {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
  });

  if (files.thumbnail) {
    await new Promise((resolve, reject) => {
      Cloudinary.uploader
        .upload_stream(
          {
            public_id: `thumbnail/Portal-${newProduct.merchantId}`,
            use_filename: true,
            tags: `${newProduct.merchantId}-tag`,
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
              newProduct.thumbnail = result?.secure_url!;
              resolve(newProduct!.thumbnail);
            }
          }
        )
        .end(files.thumbnail[0].buffer);
    });
  }

  if (files.images) {
    await new Promise((resolve, reject) => {
      files.images.map((image) => {
        const imageId = randomBytes(16).toString('hex');
        return Cloudinary.uploader
          .upload_stream(
            {
              public_id: `product-image/${imageId}-${image.originalname}/Portal-${newProduct.merchantId}`,
              use_filename: true,
              tags: `${imageId}-tag`,
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
                newProduct.images.push({
                  id: imageId,
                  URL: result?.secure_url!,
                });
                if (files.images.length === newProduct.images.length) {
                  return resolve(newProduct.images);
                }
              }
            }
          )
          .end(image.buffer);
      });
    });
  }

  const category = await Category.findOne({ name: req.query.category });
  newProduct.category = category!.id;

  const brand = await Brand.findOne({ name: req.query.brand });
  newProduct.brand = brand!.id;

  const productData = await newProduct.save();
  if (productData) {
    await new ProductCreatedPublisher(natsWrapper.client).publish({
      id: productData.id,
      merchantId: productData.merchantId,
      title: productData.title,
      description: productData.description,
      thumbnail: productData.thumbnail,
      price: productData.price,
      isUsed: productData.isUsed,
      isAvailable: productData.isAvaliable,
      version: productData.version,
      images: productData.images,
    });
  }

  logger.info(`${newProduct.title} is created successfully`);
  res.status(201).json({
    status: 201,
    newProduct,
    message: 'Product created Successfully!',
    success: true,
  });
};

/**
 * Get specific product by id controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getProduct = async (req: Request, res: Response): Promise<void> => {
  if (
    !req.query.productId ||
    !mongoose.Types.ObjectId.isValid(String(req.query.productId))
  ) {
    logger.error(`${req.query.productId} is invalid`);
    throw new BadRequestError('productId is invalid.');
  }

  let product = await Product.findById(req.query.productId).populate({
    path: 'reviews',
    options: { sort: { id: 1 } },
  });

  if (!product) {
    logger.error(`product is not found!`);
    throw new BadRequestError('product is not found!');
  }

  const floorRating = product.calculateAvgRating();

  logger.info(`${product}`);
  res.status(200).json({ status: 200, product, floorRating, success: true });
};

/**
 * Get all products for specific merchantId controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getAllProductForMerchantId = async (
  req: Request,
  res: Response
): Promise<void> => {
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

  const { merchantId } = req.query;

  const currentPage: any = req.query.page || 1,
    perPage = 2;

  const product = await Product.find({ merchantId })
    .sort({ created_at: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  if (product.length === 0) {
    logger.error(`there is no products`);
    throw new BadRequestError('there is no products');
  }

  logger.info(`${product}`);
  res.status(200).json({ status: 200, product, success: true });
};

/**
 * Get one product for specific merchantId controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getOneProductForMerchantId = async (
  req: Request,
  res: Response
): Promise<void> => {
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

  const { merchantId, title } = req.query;

  const product = await Product.findOne({ merchantId, title });

  if (!product) {
    logger.error(`product not found`);
    throw new BadRequestError('product not found');
  }

  logger.info(`${product}`);
  res.status(200).json({ status: 200, product, success: true });
};

/**
 * Get all products controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getProducts = async (req: Request, res: Response): Promise<void> => {
  const currentPage: any = req.query.page || 1,
    perPage = 2;

  const count = await Product.find({}).countDocuments();
  const products = await Product.find({})

    .sort({ created_at: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  if (products.length === 0) {
    logger.error(`there is no products`);
    throw new BadRequestError('there is no products.');
  }

  logger.info(`${products}`);
  res
    .status(200)
    .send({ status: 200, products, totalItems: count, success: true });
};

/**
 * Update product by id controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const product = await Product.findById(req.query.id);

  if (!product) {
    logger.error(`product is not found!`);
    throw new BadRequestError('product is not found!');
  }

  if (files.thumbnail) {
    await new Promise((resolve, reject) => {
      Cloudinary.uploader
        .upload_stream(
          {
            public_id: `thumbnail/Portal-${product.merchantId}`,
            use_filename: true,
            tags: `${product.merchantId}-tag`,
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
              product.thumbnail = result?.secure_url!;
              resolve(product!.thumbnail);
            }
          }
        )
        .end(files.profilePicture[0].buffer);
    });
  }

  if (files.images) {
    await new Promise((resolve, reject) => {
      files.images.map((image) => {
        const imageId = randomBytes(16).toString('hex');
        return Cloudinary.uploader
          .upload_stream(
            {
              public_id: `product-image-${imageId}-${image.originalname}/Portal-${product.merchantId}`,
              use_filename: true,
              tags: `${imageId}-tag`,
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
                product.images.push({ id: imageId, URL: result?.secure_url! });
                if (files.images.length === product.images.length) {
                  return resolve(product.images);
                }
              }
            }
          )
          .end(image.buffer);
      });
    });
  }

  if (req.query.imageId) {
    product.images = product.images.filter(
      (image) => image.id !== req.query.imageId
    );
  }

  _.extend(product, req.body);
  const productData = await product.save();
  if (productData) {
    const bodyData: { [key: string]: string } = {};

    _.each(req.body, (value, key: string) => {
      const fields = [
        'title',
        'description',
        'thumbnail',
        'price',
        'images',
        'isUsed',
        'isAvailable',
        'merchantId',
      ];
      fields.forEach((el) => {
        if (key === el) {
          bodyData[key] = value;
        }
      });
    });

    await new ProductUpdatedPublisher(natsWrapper.client).publish({
      id: productData.id,
      version: productData.version,
      ...bodyData,
    });
  }

  logger.info(`user ${product.merchantId} update productId : ${product.id} `);

  res.status(200).json({
    status: 200,
    product,
    message: 'Product Updated Successfully!',
    success: true,
  });
};
/**
 * Delete product by id controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  if (
    !req.query.productId ||
    !mongoose.Types.ObjectId.isValid(String(req.query.productId))
  ) {
    logger.error(`${req.query.productId} is invalid`);
    throw new BadRequestError('productId is invalid.');
  }

  const product = await Product.findById(req.query.productId);
  if (!product) {
    logger.error(`product is not found!`);
    throw new BadRequestError('product is not found!');
  }

  if (product.merchantId !== req.currentUser!.id) {
    logger.error('you can delete only your products!');
    throw new BadRequestError('you can delete only your products!');
  }

  const productData = await product.deleteOne();
  if (productData) {
    await new ProductDeletedPublisher(natsWrapper.client).publish({
      id: productData.id,
    });
  }

  logger.info(`productId : ${product.id} is deleted successfully`);
  res.send({
    status: 204,
    message: 'Product has been deleted Successfully!',
    success: true,
  });
};

/**
 * Delete all products controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const deleteAllProduct = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const products = await Product.deleteMany({});
  if (!products) {
    logger.error('there is no products');
    throw new BadRequestError('there is no products');
  }

  logger.info('Products has been deleted Successfully!');
  res.send({
    status: 204,
    message: 'Products has been deleted Successfully!',
    success: true,
  });
};

/**
 * Search about product by price or title controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const searchProduct = async (req: Request, res: Response): Promise<void> => {
  const { title, price } = req.query;
  if (!title) {
    logger.error('you must defined title query');
    throw new BadRequestError('you must defined title query');
  }

  const products = await Product.find({});

  const productsFilter = products.filter(
    (product) =>
      (product.title.toLowerCase().includes(title.toString().toLowerCase()) &&
        product.price === Number(price)) ||
      product.title.toLowerCase().includes(title.toString().toLowerCase()) ||
      product.price === Number(price)
  );

  if (products.length === 0 || productsFilter.length === 0) {
    logger.error('there is no products');
    throw new BadRequestError('there is no products');
  }

  logger.info(`filterProducts : ${productsFilter}`);
  res.status(200).send({ status: 200, product: productsFilter, success: true });
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

/**
 * Get Related Products controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getRelatedProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { productId } = req.query;
  const product = await Product.findById(productId);
  if (!product) {
    logger.error(`product not found`);
    throw new BadRequestError('product not found');
  }

  const getRelatedProducts = await Product.find({ category: product.category });
  res.send({
    status: 200,
    RelatedProducts: getRelatedProducts,
    success: true,
  });
};

export {
  createNewProduct,
  getProduct,
  getAllProductForMerchantId,
  getProducts,
  deleteProduct,
  deleteAllProduct,
  updateProduct,
  searchProduct,
  logReader,
  getOneProductForMerchantId,
  getRelatedProducts,
};
