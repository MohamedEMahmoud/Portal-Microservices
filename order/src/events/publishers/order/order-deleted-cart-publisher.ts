import {
  Publisher,
  OrderDeletedCartEvent,
  Subjects,
} from '@portal-microservices/common';

export class OrderCartDeletedPublisher extends Publisher<OrderDeletedCartEvent> {
  readonly subject = Subjects.OrderDeletedCart;
}
