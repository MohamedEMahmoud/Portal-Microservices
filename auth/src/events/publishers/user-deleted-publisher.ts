import {
  Subjects,
  Publisher,
  UserDeletedEvent,
} from '@portal-microservices/common';

export class UserDeletedPublisher extends Publisher<UserDeletedEvent> {
  readonly subject = Subjects.UserDeleted;
}
