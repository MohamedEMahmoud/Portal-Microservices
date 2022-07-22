import {
  Subjects,
  Listener,
  CartUpdatedEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { Cart } from '../../../models/cart.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class CartUpdatedListener extends Listener<CartUpdatedEvent> {
  readonly subject = Subjects.CartUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: CartUpdatedEvent['data'], msg: Message) {
    const cart = await Cart.findByEvent(data);
    if (!cart) {
      throw new BadRequestError('cart not found.');
    }

    let fields: { [key: string]: any } = { ...data };

    delete fields['version'];

    cart.set({ ...fields });

    await cart.save();

    msg.ack();
  }
}
