import {
  Subjects,
  Listener,
  CouponDeletedEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { Coupon } from '../../../models/coupon.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class CouponDeletedListener extends Listener<CouponDeletedEvent> {
  readonly subject = Subjects.CouponDeleted;
  queueGroupName = queueGroupName;
  async onMessage(data: CouponDeletedEvent['data'], msg: Message) {
    const coupon = await Coupon.findByIdAndRemove(data.id);

    if (!coupon) {
      throw new BadRequestError('Coupon not found.');
    }

    msg.ack();
  }
}
