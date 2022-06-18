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
import cookieSession from 'cookie-session';

const app = express();

app.set('trust proxy', true);
app.use([
  json(),
  //Passport Initialized
  passport.initialize(),
  //Setting Up Session
  passport.session(),
  cookieSession({ signed: false, secure: process.env.NODE_ENV !== 'test' }),
  currentUser,
  usersRouter,
]);

app.use(
  '*',
  async () => {
    throw new NotFoundError();
  },
  errorHandler
);

export { app };
