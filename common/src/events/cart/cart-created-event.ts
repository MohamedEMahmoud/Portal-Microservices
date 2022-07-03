import { Subjects } from '../subjects';

export interface CartCreatedEvent {
  subject: Subjects.CartCreated;
  data: {
    id: string;
    customer: string;
    cartItems: {
      product: string;
      quantity: number;
      price: number;
    }[];
    totalCartPrice: number;
    totalPriceAfterDiscount?: number;
    version: number;
  };
}
