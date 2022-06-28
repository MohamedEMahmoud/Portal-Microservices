import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import { usersRouter } from './routers/user.route';
import passport from 'passport';
import './services/passport.services';
import {
  currentUser,
  NotFoundError,
  errorHandler,
} from '@portal-microservices/common';
import session from 'express-session';
import hpp from 'hpp';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';

let MongoDbStore = require('connect-mongodb-session')(session);

const store = new MongoDbStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions',
});

let whitelist = ['https://portal-microservices.dev', 'https://web.postman.co'];
let corsOptions: cors.CorsOptions = {
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  origin: whitelist,
};

const app = express();

app.set('trust proxy', true);

app.use(
  session({
    store: store,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV !== 'test' },
  }),
  json(),
  cors(corsOptions),
  //Passport Initialized
  passport.initialize(),
  //Setting Up Session
  passport.session(),
  hpp(),
  helmet(),
  morgan('dev'),
  compression(),
  currentUser,
  usersRouter
);

app.use(
  '*',
  async () => {
    throw new NotFoundError();
  },
  errorHandler
);

export { app };
