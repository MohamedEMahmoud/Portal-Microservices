import { Subjects } from '../subjects';

export interface CartDeletedEvent {
  subject: Subjects.CartDeleted;
  data: {
    id: number;
  };
}
