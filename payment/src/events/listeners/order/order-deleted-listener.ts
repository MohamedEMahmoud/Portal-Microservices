import {
  Subjects,
  Listener,
  OrderDeletedEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { Order } from '../../../models/order/order.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class OrderDeletedListener extends Listener<OrderDeletedEvent> {
  readonly subject = Subjects.OrderDeleted;
  queueGroupName = queueGroupName;
  async onMessage(data: OrderDeletedEvent['data'], msg: Message) {
    const order = await Order.findByIdAndRemove(data.id);

    if (!order) {
      throw new BadRequestError('Order not found.');
    }

    msg.ack();
  }
}
