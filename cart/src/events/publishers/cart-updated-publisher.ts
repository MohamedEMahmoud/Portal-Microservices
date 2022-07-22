import {
  Publisher,
  CartUpdatedEvent,
  Subjects,
} from '@portal-microservices/common';

export class CartUpdatedPublisher extends Publisher<CartUpdatedEvent> {
  readonly subject = Subjects.CartUpdated;
}
