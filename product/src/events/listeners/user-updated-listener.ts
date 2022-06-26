import {
  Subjects,
  Listener,
  UserUpdatedEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { User } from '../../models/user.model';
import { queueGroupName } from './queue-group-name';
import { Message } from 'node-nats-streaming';

export class UserUpdatedListener extends Listener<UserUpdatedEvent> {
  readonly subject = Subjects.UserUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: UserUpdatedEvent['data'], msg: Message) {
    const user = await User.findByEvent(data);
    if (!user) {
      throw new BadRequestError('User not found.');
    }

    let fields: { [key: string]: any } = { ...data };

    delete fields['version'];

    user.set({ ...fields });

    await user.save();

    msg.ack();
  }
}
