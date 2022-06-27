import mongoose from 'mongoose';
import { v2 as Cloudinary } from 'cloudinary';
import { app } from './app';
import { LoggerService } from '@portal-microservices/common';
import { natsWrapper } from './nats-wrapper';

let logger = new LoggerService('auth');

(async () => {
  const Environment = [
    'MONGO_URI',
    'JWT_KEY',
    'CLOUDINARY_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_SECRET_KEY',
    'MAIL_PASS',
    'MAIL_SERVER_PORT',
    'PORT',
    'RESET_PASSWORD_EXPIRATION_KEY',
    'CLIENT_ID',
    'CLIENT_SECRET',
    'REFRESH_TOKEN',
    'REDIRECT_URI',
    'OTP_CODE_EXPIRATION',
    'SESSION_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'COUNTRY_CODE',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'LOG_FILE_PATH',
    'LOG_FILE_NAME'
  ];

  Environment.forEach((el) => {
    if (!process.env[el]) {
      throw new Error(`${el} Must Be Defined.`);
    }
  });

  try {
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID!,
      process.env.NATS_CLIENT_ID!,
      process.env.NATS_URL!
    );
    natsWrapper.client.on('close', () => {
      console.log('Nats Connection Closed!');
      process.exit();
    });

    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());

    await mongoose.connect(process.env.MONGO_URI!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    mongoose.Promise = global.Promise;
    logger.info('Connection to Mongodb Successfully! From Auth Service');

    Cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });
  } catch (e) {
    logger.error(`Error is : ${e} From Auth Service`);
  }

  const PORT = 3000 || process.env.PORT;
  app.listen(PORT, () =>
    logger.info(`Server Listening On Port ${PORT} From Auth Service`)
  );
})();
