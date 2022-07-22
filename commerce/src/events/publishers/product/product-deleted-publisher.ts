import {
  Publisher,
  ProductDeletedEvent,
  Subjects,
} from '@portal-microservices/common';

export class ProductDeletedPublisher extends Publisher<ProductDeletedEvent> {
  readonly subject = Subjects.ProductDeleted;
}
