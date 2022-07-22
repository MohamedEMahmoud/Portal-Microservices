import {
  Publisher,
  OrderUpdatedEvent,
  Subjects,
} from '@portal-microservices/common';

export class OrderUpdatedPublisher extends Publisher<OrderUpdatedEvent> {
  readonly subject = Subjects.OrderUpdated;
}
