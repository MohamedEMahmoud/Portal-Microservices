import { Subjects } from '../subjects';

export interface OrderDeletedCartEvent {
  subject: Subjects.OrderDeletedCart;
  data: {
    id: string;
  };
}
