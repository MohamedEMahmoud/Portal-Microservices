import {
  Subjects,
  Listener,
  UserCreatedEvent,
} from '@portal-microservices/common';
import { User } from '../../models/user.model';
import { queueGroupName } from './queue-group-name';
import { Message } from 'node-nats-streaming';

export class UserCreatedListener extends Listener<UserCreatedEvent> {
  readonly subject = Subjects.UserCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: UserCreatedEvent['data'], msg: Message) {
    const user = User.build({
      id: data.id,
      username: data.username,
      profilePicture: data.profilePicture,
      role: data.role,
      email: data.email,
    });

    await user.save();

    msg.ack();
  }
}
