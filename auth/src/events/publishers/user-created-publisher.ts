import {
  Publisher,
  UserCreatedEvent,
  Subjects,
} from '@portal-microservices/common';

export class UserCreatedPublisher extends Publisher<UserCreatedEvent> {
  readonly subject = Subjects.UserCreated;
}
