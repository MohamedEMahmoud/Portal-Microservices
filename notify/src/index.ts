import { natsWrapper } from './nats-wrapper';
import { OrderCreatedListener } from './events/listeners/order-created-listener';

const start = async () => {
  const Environment = [
    'NATS_CLUSTER_ID',
    'NATS_URL',
    'NATS_CLIENT_ID',
    'REDIS_HOST',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
  ];
  Environment.forEach((el) => {
    if (!process.env[el]) {
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
      console.log('Nats Connection Closed From Notify Service!');
      process.exit();
    });

    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());

    new OrderCreatedListener(natsWrapper.client).listen();
  } catch (e) {
    console.log(e);
  }
};

start();
