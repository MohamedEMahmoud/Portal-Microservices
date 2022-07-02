import { Subjects } from '../subjects';

export interface CouponCreatedEvent {
  subject: Subjects.CouponCreated;
  data: {
    id: string;
    admin: string;
    coupon: string;
    expire: string;
    discount: number;
    version: number;
  };
}
