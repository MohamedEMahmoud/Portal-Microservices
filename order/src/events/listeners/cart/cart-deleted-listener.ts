import {
  Subjects,
  Listener,
  CartDeletedEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { Cart } from '../../../models/cart.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class CartDeletedListener extends Listener<CartDeletedEvent> {
  readonly subject = Subjects.CartDeleted;
  queueGroupName = queueGroupName;
  async onMessage(data: CartDeletedEvent['data'], msg: Message) {
    const cart = await Cart.findByIdAndRemove(data.id);

    if (!cart) {
      throw new BadRequestError('Cart not found.');
    }

    msg.ack();
  }
}
