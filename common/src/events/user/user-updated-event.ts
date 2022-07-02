import { Subjects } from '../subjects';
import { RolesType } from '../../types/roles-type';

export interface UserUpdatedEvent {
  subject: Subjects.UserUpdated;
  data: {
    id: string;
    email?: string;
    username?: string;
    profilePicture?: string;
    role?: RolesType;
    version: number;
  };
}
