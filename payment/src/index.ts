import mongoose from 'mongoose';
import { app } from './app';
import { LoggerService } from '@portal-microservices/common';
import { UserCreatedListener } from './events/listeners/user/user-created-listener';
import { UserUpdatedListener } from './events/listeners/user/user-updated-listener';
import { UserDeletedListener } from './events/listeners/user/user-deleted-listener';
import { OrderCreatedListener } from './events/listeners/order/order-created-listener';
import { OrderUpdatedListener } from './events/listeners/order/order-updated-listener';
import { OrderDeletedListener } from './events/listeners/order/order-deleted-listener';
import { ProductCreatedListener } from './events/listeners/product/product-created-listener';
import { ProductUpdatedListener } from './events/listeners/product/product-updated-listener';
import { ProductDeletedListener } from './events/listeners/product/product-deleted-listener';

import { natsWrapper } from './nats-wrapper';

let logger = new LoggerService(process.env.LOG_FILE_NAME!);

(async () => {
  const Environment = [
    'MONGO_URI',
    'JWT_KEY',
    'PORT',
    'NATS_URL',
    'NATS_CLIENT_ID',
    'NATS_CLUSTER_ID',
    'SESSION_SECRET',
    'LOG_FILE_PATH',
    'LOG_FILE_NAME',
    'ENCRYPT_SECRET_KEY',
    'algorithm',
    'STRIPE_KEY',
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

    new ProductCreatedListener(natsWrapper.client).listen();
    new ProductUpdatedListener(natsWrapper.client).listen();
    new ProductDeletedListener(natsWrapper.client).listen();

    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderUpdatedListener(natsWrapper.client).listen();
    new OrderDeletedListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    mongoose.Promise = global.Promise;
    logger.info('Connection to Mongodb Successfully!');
  } catch (e) {
    logger.error(`Error is : ${e} From Payment Service`);
  }

  const PORT = 3000 || process.env.PORT;
  app.listen(PORT, () =>
    logger.info(`Server Listening On Port ${PORT} From Payment Service`)
  );
})();
