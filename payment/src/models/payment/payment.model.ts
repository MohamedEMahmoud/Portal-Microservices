import mongoose from 'mongoose';

interface PaymentAttrs {
  orderId: string;
  stripeId: string;
  customer: string;
  paymentMethodType: string;
  paid: boolean;
  paidAt: Date;
  price: number;
  status: string;
}

interface PaymentDoc extends mongoose.Document {
  id: string;
  orderId: string;
  stripeId: string;
  customer: string;
  paymentMethodType: string;
  paidAt: Date;
  paid: boolean;
  price: number;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

interface PaymentModel extends mongoose.Model<PaymentDoc> {
  build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    orderId: {
      type: String,
      required: true,
    },

    stripeId: {
      type: String,
      required: true,
    },

    paymentMethodType: {
      type: String,
      enum: ['cash', 'card'],
      default: 'cash',
    },

    paid: {
      type: Boolean,
      default: false,
    },

    paidAt: {
      type: Date,
    },

    price: { type: Number, required: true },

    success: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        (ret.id = ret._id), delete ret._id, delete ret.password;
      },
    },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

paymentSchema.statics.build = (attrs: PaymentAttrs) => {
  return new Payment(attrs);
};

const Payment = mongoose.model<PaymentDoc, PaymentModel>(
  'Payment',
  paymentSchema
);

export { Payment };
