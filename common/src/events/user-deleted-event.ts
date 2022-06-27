import { Subjects } from './subjects';

export interface UserDeletedEvent {
  subject: {
    UserUpdated: Subjects.UserDeleted;
  };
  data: {
    id: string;
  };
}
