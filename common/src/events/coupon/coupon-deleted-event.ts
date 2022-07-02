import { Subjects } from '../subjects';

export interface CouponDeletedEvent {
  subject: Subjects.CouponDeleted;
  data: {
    id: string;
  };
}
