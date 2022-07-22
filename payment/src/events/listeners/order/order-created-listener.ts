import {
  Subjects,
  Listener,
  OrderCreatedEvent,
} from '@portal-microservices/common';
import { Order } from '../../../models/order/order.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    const order = Order.build({
      id: data.id,
      customer: data.customer,
      cartItems: data.cartItems,
      shippingAddress: {
        name: data.shippingAddress.name,
        address: data.shippingAddress.address,
        phone: data.shippingAddress.phone,
        city: data.shippingAddress.city,
        country: data.shippingAddress.country,
        postalCode: data.shippingAddress.postalCode,
      },
      totalOrderPrice: data.totalOrderPrice,
      deliveredAt: data.deliveredAt,
      version: data.version,
    });

    await order.save();

    msg.ack();
  }
}
