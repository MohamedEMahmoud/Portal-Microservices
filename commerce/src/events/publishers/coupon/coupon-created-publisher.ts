import {
  Publisher,
  CouponCreatedEvent,
  Subjects,
} from '@portal-microservices/common';

export class CouponCreatedPublisher extends Publisher<CouponCreatedEvent> {
  readonly subject = Subjects.CouponCreated;
}
