import { Subjects } from '../subjects';

export interface OrderUpdatedEvent {
  subject: Subjects.OrderUpdated;
  data: {
    id: string;
    taxPrice?: number;
    shippingPrice?: number;
    version: number;
  };
}
