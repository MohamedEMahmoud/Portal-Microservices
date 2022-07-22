import {
  Subjects,
  Listener,
  ProductDeletedEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { Product } from '../../../models/product/product.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class ProductDeletedListener extends Listener<ProductDeletedEvent> {
  readonly subject = Subjects.ProductDeleted;
  queueGroupName = queueGroupName;
  async onMessage(data: ProductDeletedEvent['data'], msg: Message) {
    const product = await Product.findByIdAndRemove(data.id);

    if (!product) {
      throw new BadRequestError('Product not found.');
    }

    msg.ack();
  }
}
