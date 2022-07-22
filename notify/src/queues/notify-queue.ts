import Queue from 'bull';
import { client } from '../twilio';

interface Payload {
  customerId: string;
  customerPhone: string;
  deliveredAt: string;
}

const notifyQueue = new Queue<Payload>('Notify', {
  redis: {
    host: process.env.REDIS_HOST,
  },
});

notifyQueue.process(async (job) => {
  const options = {
    to: job.data.customerPhone,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: `We remind you that you have an order that will reach you at ${job.data.deliveredAt}`,
  };

  console.log(options);

  client.messages.create(options, function (err, response) {
    if (err) {
      console.error(err);
    } else {
      console.log(`Message sent to ${job.data.customerId}`);
      console.log(
        `Date-Created: ${response.dateCreated} || Date-Sent: ${response.dateSent}`
      );
    }
  });
});

export { notifyQueue };
