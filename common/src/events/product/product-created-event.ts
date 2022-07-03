import { Subjects } from '../subjects';

export interface ProductCreatedEvent {
  subject: Subjects.ProductCreated;
  data: {
    id: string;
    merchantId: string;
    title: string;
    description: string;
    thumbnail: string;
    images?: { id: string; URL: string }[];
    price: number;
    isUsed: boolean;
    isAvailable: boolean;
    version: number;
  };
}
