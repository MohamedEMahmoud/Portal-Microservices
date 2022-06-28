import {
  Publisher,
  UserUpdatedEvent,
  Subjects,
} from '@portal-microservices/common';
export class UserUpdatedPublisher extends Publisher<UserUpdatedEvent> {
  readonly subject = Subjects.UserUpdated;
}
