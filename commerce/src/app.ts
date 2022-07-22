import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import {
  currentUser,
  errorHandler,
  NotFoundError,
} from '@portal-microservices/common';
import { productsRouter } from './product/product.route';
import { categoryRouter } from './category/category.route';
import { brandRouter } from './brand/brand.route';
import { reviewRouter } from './review/review.route';
import { couponRouter } from './coupon/coupon.route';
import session from 'express-session';
import hpp from 'hpp';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';

let whitelist = ['https://portal-microservices.dev', 'https://web.postman.co'];
let corsOptions: cors.CorsOptions = {
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  origin: whitelist,
};

const app = express();
app.set('trust proxy', true);
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV !== 'test' },
  }),
  function (req, _res, next) {
    req.session['jwt'] = String(req.headers['cookie'])
      .split(';')
      .filter((text) => text.trim().includes('session='))
      .join('')
      .replace('session=', '')
      .trim();
    next();
  },
  json(),
  cors(corsOptions),
  hpp(),
  helmet(),
  morgan('dev'),
  compression(),
  currentUser,
  productsRouter,
  categoryRouter,
  brandRouter,
  couponRouter,
  reviewRouter
);

// Midlewares
app.use(
  '*',
  async () => {
    throw new NotFoundError();
  },
  errorHandler
);

export { app };
