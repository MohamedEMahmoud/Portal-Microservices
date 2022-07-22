import {
  Subjects,
  Listener,
  CouponCreatedEvent,
} from '@portal-microservices/common';
import { Coupon } from '../../../models/coupon.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class CouponCreatedListener extends Listener<CouponCreatedEvent> {
  readonly subject = Subjects.CouponCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: CouponCreatedEvent['data'], msg: Message) {
    const coupon = Coupon.build({
      id: data.id,
      admin: data.admin,
      coupon: data.coupon,
      expire: data.expire,
      discount: data.discount,
      version: data.version,
    });

    await coupon.save();

    msg.ack();
  }
}
