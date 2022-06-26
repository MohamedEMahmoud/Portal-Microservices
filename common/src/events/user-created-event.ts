import { RolesType } from '../types/roles-type';
import { Subjects } from './subjects';

export interface UserCreatedEvent {
  subject: Subjects.UserCreated;
  data: {
    id: string;
    email: string;
    username: string;
    profilePicture: string;
    role: RolesType;
    version: number;
  };
}