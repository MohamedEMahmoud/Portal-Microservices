import { Subjects } from '../subjects';

export interface OrderUpdatedEvent {
  subject: Subjects.OrderUpdated;
  data: {
    id: string;
    shippingAddress: {
      name: string;
      address: string;
      phone: string;
      city: string;
      country: string;
      postalCode: string;
    };
    version: number;
  };
}
