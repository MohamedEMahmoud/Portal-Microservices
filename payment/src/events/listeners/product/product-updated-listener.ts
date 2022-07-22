import {
  Subjects,
  Listener,
  ProductUpdatedEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { Product } from '../../../models/product/product.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class ProductUpdatedListener extends Listener<ProductUpdatedEvent> {
  readonly subject = Subjects.ProductUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: ProductUpdatedEvent['data'], msg: Message) {
    const product = await Product.findByEvent(data);
    if (!product) {
      throw new BadRequestError('Product not found.');
    }

    let fields: { [key: string]: any } = { ...data };

    delete fields['version'];

    product.set({ ...fields });

    await product.save();

    msg.ack();
  }
}
