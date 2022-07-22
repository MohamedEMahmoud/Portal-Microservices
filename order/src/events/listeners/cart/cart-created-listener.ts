import {
  Subjects,
  Listener,
  CartCreatedEvent,
} from '@portal-microservices/common';
import { Cart } from '../../../models/cart.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class CartCreatedListener extends Listener<CartCreatedEvent> {
  readonly subject = Subjects.CartCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: CartCreatedEvent['data'], msg: Message) {
    const cart = Cart.build({
      id: data.id,
      customer: data.customer,
      cartItems: data.cartItems,
      totalCartPrice: data.totalCartPrice,
      totalPriceAfterDiscount: data.totalPriceAfterDiscount,
      version: data.version,
    });

    await cart.save();

    msg.ack();
  }
}
