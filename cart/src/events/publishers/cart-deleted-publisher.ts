import {
  Publisher,
  CartDeletedEvent,
  Subjects,
} from '@portal-microservices/common';

export class CartDeletedPublisher extends Publisher<CartDeletedEvent> {
  readonly subject = Subjects.CartDeleted;
}
