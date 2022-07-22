import {
  Subjects,
  Listener,
  CouponUpdatedEvent,
  BadRequestError,
} from '@portal-microservices/common';
import { Coupon } from '../../../models/coupon.model';
import { queueGroupName } from '../queue-group-name';
import { Message } from 'node-nats-streaming';

export class CouponUpdatedListener extends Listener<CouponUpdatedEvent> {
  readonly subject = Subjects.CouponUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: CouponUpdatedEvent['data'], msg: Message) {
    const coupon = await Coupon.findByEvent(data);
    if (!coupon) {
      throw new BadRequestError('Coupon not found.');
    }

    let fields: { [key: string]: any } = { ...data };

    delete fields['version'];

    coupon.set({ ...fields });

    await coupon.save();

    msg.ack();
  }
}
