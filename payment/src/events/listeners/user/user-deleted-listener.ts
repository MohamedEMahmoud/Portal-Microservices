import {
  Subjects,
  Listener,
  UserDeletedEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { User } from '../../../models/user/user.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class UserDeletedListener extends Listener<UserDeletedEvent> {
  readonly subject = Subjects.UserDeleted;
  queueGroupName = queueGroupName;
  async onMessage(data: UserDeletedEvent['data'], msg: Message) {
    const user = await User.findByIdAndRemove(data.id);

    if (!user) {
      throw new BadRequestError('User not found.');
    }

    msg.ack();
  }
}
