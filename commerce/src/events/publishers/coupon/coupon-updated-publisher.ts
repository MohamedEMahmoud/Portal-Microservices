import {
  Publisher,
  CouponUpdatedEvent,
  Subjects,
} from '@portal-microservices/common';

export class CouponUpdatedPublisher extends Publisher<CouponUpdatedEvent> {
  readonly subject = Subjects.CouponUpdated;
}
