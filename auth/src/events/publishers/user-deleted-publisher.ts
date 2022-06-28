import {
  Publisher,
  UserDeletedEvent,
  Subjects,
} from '@portal-microservices/common';

export class UserDeletedPublisher extends Publisher<UserDeletedEvent> {
  readonly subject = Subjects.UserDeleted;
}
