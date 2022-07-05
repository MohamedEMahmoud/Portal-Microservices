import { Subjects } from '../subjects';

export interface OrderCreatedEvent {
  subject: Subjects.OrderCreated;
  data: {
    id: string;
    customer: {
      id: string;
      phone: string;
    };
    totalOrderPrice: number;
    shippingAddress: {
      details: string;
      phone: string;
      city: string;
      postalCode: string;
    };
    deliveredAt: string;
    version: number;
  };
}
