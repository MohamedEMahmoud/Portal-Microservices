import { Subjects } from '../subjects';

export interface OrderUpdatedEvent {
  subject: Subjects.OrderUpdated;
  data: {
    id: string;
    shippingAddress: {
      details: string;
      phone: string;
      city: string;
      postalCode: string;
    };
    version: number;
  };
}
