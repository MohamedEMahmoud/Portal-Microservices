import {
  Publisher,
  UserUpdatedEvent,
} from '@portal-microservices/common';
import { natsWrapper } from '../../nats-wrapper';

export class UserUpdatedPublisher extends Publisher<UserUpdatedEvent> { }
