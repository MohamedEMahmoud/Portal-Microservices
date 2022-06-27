import {
  Publisher,
  UserDeletedEvent,
} from '@portal-microservices/common';
import { natsWrapper } from '../../nats-wrapper';

export class UserDeletedPublisher extends Publisher<UserDeletedEvent> { }
