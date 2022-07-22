import {
  Publisher,
  ProductUpdatedEvent,
  Subjects,
} from '@portal-microservices/common';

export class ProductUpdatedPublisher extends Publisher<ProductUpdatedEvent> {
  readonly subject = Subjects.ProductUpdated;
}
