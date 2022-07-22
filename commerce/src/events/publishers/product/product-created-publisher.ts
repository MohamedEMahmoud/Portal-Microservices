import {
  Publisher,
  ProductCreatedEvent,
  Subjects,
} from '@portal-microservices/common';

export class ProductCreatedPublisher extends Publisher<ProductCreatedEvent> {
  readonly subject = Subjects.ProductCreated;
}
