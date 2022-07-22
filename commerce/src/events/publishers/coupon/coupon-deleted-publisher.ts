import {
  Publisher,
  CouponDeletedEvent,
  Subjects,
} from '@portal-microservices/common';

export class CouponDeletedPublisher extends Publisher<CouponDeletedEvent> {
  readonly subject = Subjects.CouponDeleted;
}
