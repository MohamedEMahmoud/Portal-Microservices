import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import {
  currentUser,
  errorHandler,
  NotFoundError,
} from '@portal-microservices/common';
import session from 'express-session';
import hpp from 'hpp';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import { wishlistRouter } from './routers/wishlist.route';
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
  wishlistRouter
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
