import {
  Subjects,
  Listener,
  ProductCreatedEvent,
} from '@portal-microservices/common';
import { Product } from '../../../models/product.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class ProductCreatedListener extends Listener<ProductCreatedEvent> {
  readonly subject = Subjects.ProductCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: ProductCreatedEvent['data'], msg: Message) {
    const product = Product.build({
      id: data.id,
      version: data.version,
      merchantId: data.merchantId,
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      price: data.price,
      isUsed: data.isUsed,
      isAvailable: data.isAvailable,
      images: data.images,
    });

    await product.save();

    msg.ack();
  }
}
