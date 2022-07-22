import {
  Publisher,
  CartCreatedEvent,
  Subjects,
} from '@portal-microservices/common';

export class CartCreatedPublisher extends Publisher<CartCreatedEvent> {
  readonly subject = Subjects.CartCreated;
}
