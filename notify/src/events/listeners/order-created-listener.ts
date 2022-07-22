import {
  Listener,
  Subjects,
  OrderCreatedEvent,
} from '@portal-microservices/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { notifyQueue } from '../../queues/notify-queue';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    const delay =
      new Date(`${data.deliveredAt}`).getTime() - new Date().getTime();

    notifyQueue.add(
      {
        customerId: data.customer,
        customerPhone: data.shippingAddress.phone,
        deliveredAt: data.deliveredAt,
      },
      { delay }
    );

    msg.ack();
  }
}
