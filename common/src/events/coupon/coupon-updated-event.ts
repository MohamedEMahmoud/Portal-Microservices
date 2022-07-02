import { Subjects } from '../subjects';

export interface CouponUpdatedEvent {
  subject: Subjects.CouponUpdated;
  data: {
    id: string;
    expire?: string;
    discount?: number;
    version: number;
  };
}
