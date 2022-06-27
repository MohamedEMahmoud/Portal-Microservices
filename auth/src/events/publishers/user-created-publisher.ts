import {
  Publisher,
  UserCreatedEvent,
} from '@portal-microservices/common';
import { natsWrapper } from '../../nats-wrapper';

export class UserCreatedPublisher extends Publisher<UserCreatedEvent> { }


