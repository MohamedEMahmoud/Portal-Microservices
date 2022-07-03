import { Subjects } from '../subjects';

export interface CartUpdatedEvent {
  subject: Subjects.CartUpdated;
  data: {
    id: string;
    customer?: string;
    cartItems?: {
      product: string;
      quantity: number;
      price: number;
    }[];
    totalCartPrice?: number;
    totalPriceAfterDiscount?: number;
    version: number;
  };
}
