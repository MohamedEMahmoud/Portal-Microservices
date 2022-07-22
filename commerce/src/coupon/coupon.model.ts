import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface CouponAttrs {
  admin: string;
  coupon: string;
  expire: string;
  discount: number;
}

interface CouponDoc extends mongoose.Document {
  admin: string;
  coupon: string;
  expire: string;
  discount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface CouponModel extends mongoose.Model<CouponDoc> {
  build(attrs: CouponAttrs): CouponDoc;
}

const couponSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    coupon: {
      type: String,
      trim: true,
      required: [true, 'Coupon name required'],
      unique: true,
    },

    expire: {
      type: String,
      required: [true, 'Coupon expire time required'],
    },

    discount: {
      type: Number,
      required: [true, 'Coupon discount value required'],
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        (ret.id = ret._id), delete ret._id;
      },
    },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

couponSchema.set('versionKey', 'version');
couponSchema.plugin(updateIfCurrentPlugin);

couponSchema.statics.build = (attrs: CouponAttrs) => {
  return new Coupon(attrs);
};

const Coupon = mongoose.model<CouponDoc, CouponModel>('Coupon', couponSchema);

export { Coupon };
