import mongoose from 'mongoose';
import { v2 as Cloudinary } from 'cloudinary';
import { app } from './app';
import { LoggerService } from '../src/services/logger.services';

let logger = new LoggerService('user.controller');

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
  ];

  Environment.forEach((el) => {
    if (!process.env[el]) {
      throw new Error(`${el} Must Be Defined.`);
    }
  });

  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    mongoose.Promise = global.Promise;
    console.log('Connection to Mongodb Successfully!');

    Cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });
  } catch (e) {
    console.log(`Error is : ${e}`);
  }

  const PORT = 3000 || process.env.PORT;
  app.listen(PORT, () =>
    console.log(`Server Listening On Port ${PORT} From Auth Service`)
  );
})();
