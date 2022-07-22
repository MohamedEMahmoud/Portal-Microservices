import {
  Subjects,
  Listener,
  OrderDeletedCartEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { Cart } from '../../../models/cart.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';
import { CartDeletedPublisher } from '../../publishers/cart-deleted-publisher';
import { natsWrapper } from '../../../nats-wrapper';

export class OrderCartDeletedListener extends Listener<OrderDeletedCartEvent> {
  readonly subject = Subjects.OrderDeletedCart;
  queueGroupName = queueGroupName;
  async onMessage(data: OrderDeletedCartEvent['data'], msg: Message) {
    const cart = await Cart.findByIdAndRemove(data.id);

    if (!cart) {
      throw new BadRequestError('Cart not found.');
    }

    await new CartDeletedPublisher(natsWrapper.client).publish({
      id: cart.id,
    });

    msg.ack();
  }
}
