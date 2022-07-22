import {
  Subjects,
  Listener,
  OrderUpdatedEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { Order } from '../../../models/order/order.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class OrderUpdatedListener extends Listener<OrderUpdatedEvent> {
  readonly subject = Subjects.OrderUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderUpdatedEvent['data'], msg: Message) {
    const order = await Order.findByEvent(data);
    if (!order) {
      throw new BadRequestError('Order not found.');
    }

    let fields: { [key: string]: any } = { ...data };

    delete fields['version'];

    order.set({ ...fields });

    await order.save();

    msg.ack();
  }
}
