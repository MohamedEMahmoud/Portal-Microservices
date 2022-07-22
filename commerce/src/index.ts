import mongoose from 'mongoose';
import { v2 as Cloudinary } from 'cloudinary';
import { app } from './app';
import { LoggerService } from '@portal-microservices/common';
import { UserCreatedListener } from './events/listeners/user-created-listener';
import { UserUpdatedListener } from './events/listeners/user-updated-listener';
import { UserDeletedListener } from './events/listeners/user-deleted-listener';
import { natsWrapper } from './nats-wrapper';

let logger = new LoggerService(process.env.LOG_FILE_PATH!);

const start = async () => {
  const Environment = [
    'MONGO_URI',
    'JWT_KEY',
    'CLOUDINARY_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_SECRET_KEY',
    'PORT',
    'NATS_URL',
    'NATS_CLIENT_ID',
    'NATS_CLUSTER_ID',
    'SESSION_SECRET',
    'LOG_FILE_PATH',
    'LOG_FILE_NAME',
  ];
  Environment.forEach((el) => {
    if (!process.env[el]) {
      logger.error(`${el} Must Be Defined`);
      throw new Error(`${el} Must Be Defined`);
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

    new UserCreatedListener(natsWrapper.client).listen();
    new UserUpdatedListener(natsWrapper.client).listen();
    new UserDeletedListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    mongoose.Promise = global.Promise;
    logger.info('Connection to Mongodb Successfully!');

    Cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });
  } catch (e) {
    logger.error(`Error is : ${e} From Commerce Service`);
  }

  const PORT = 3000 || process.env.PORT;
  app.listen(PORT, () =>
    logger.info(`Server Listening On Port ${PORT} From Commerce Service`)
  );
};

start();
