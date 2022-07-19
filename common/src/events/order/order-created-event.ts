import { Subjects } from '../subjects';

export interface OrderCreatedEvent {
  subject: Subjects.OrderCreated;
  data: {
    id: string;
    customer: string;
    totalOrderPrice: number;
    cartItems: {
      product: string;
      quantity: number;
      price: number;
    }[];
    shippingAddress: {
      name: string;
      address: string;
      phone: string;
      city: string;
      country: string;
      postalCode: string;
    };
    deliveredAt: string;
    version: number;
  };
}
