import express, { Request, Response } from 'express';
import { BadRequestError } from '@portal-microservices/common';
import { Product } from '../models/product.model';
import { v2 as Cloudinary } from 'cloudinary';
import { randomBytes } from 'crypto';
import mongoose from 'mongoose';
import _ from 'lodash';
import slugify from 'slugify';

/**
 * Create new product controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const createNewProduct = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!req.body) {
    throw new BadRequestError("Can't not send Empty Request");
  }

  if (!req.body.price) {
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

  await newProduct.save();
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
    throw new BadRequestError('productId is invalid.');
  }

  const product = await Product.findById(req.query.productId);

  if (!product) {
    throw new BadRequestError('product is not found!');
  }

  res.status(200).json({ status: 200, product, success: true });
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
  const product = await Product.find({ merchantId: req.currentUser!.id });

  if (product.length === 0) {
    throw new BadRequestError('there is no products');
  }

  res.status(200).json({ status: 200, product, success: true });
};

/**
 * Get all products controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getProducts = async (req: Request, res: Response): Promise<void> => {
  const products = await Product.find({});

  if (products.length === 0) {
    throw new BadRequestError('there is no products.');
  }

  res.status(200).send({ status: 200, products, success: true });
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
  await product.save();

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
    throw new BadRequestError('productId is invalid.');
  }

  const product = await Product.findById(req.query.productId);
  if (!product) {
    throw new BadRequestError('product is not found!');
  }

  if (product.merchantId !== req.currentUser!.id) {
    throw new BadRequestError('you can delete only your products!');
  }

  await product.deleteOne();
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

const deleteAllProduct = async (req: Request, res: Response): Promise<void> => {
  const products = await Product.deleteMany({});
  if (!products) {
    throw new BadRequestError('product is not found!');
  }

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
    throw new BadRequestError('you must defined title query');
  }

  const products = await Product.find({});

  console.log(products);

  const productsFilter = products.filter(
    (product) =>
      (product.title.toLowerCase().includes(title.toString().toLowerCase()) &&
        product.price === Number(price)) ||
      product.title.toLowerCase().includes(title.toString().toLowerCase()) ||
      product.price === Number(price)
  );

  if (products.length === 0 || productsFilter.length === 0) {
    throw new BadRequestError('there is no products');
  }

  res.status(200).send({ status: 200, product: productsFilter, success: true });
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
};
