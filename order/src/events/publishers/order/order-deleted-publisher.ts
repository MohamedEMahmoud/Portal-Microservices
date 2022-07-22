import {
  Publisher,
  OrderDeletedEvent,
  Subjects,
} from '@portal-microservices/common';

export class OrderDeletedPublisher extends Publisher<OrderDeletedEvent> {
  readonly subject = Subjects.OrderDeleted;
}
