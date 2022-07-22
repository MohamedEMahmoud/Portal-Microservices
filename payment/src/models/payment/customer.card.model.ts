import mongoose from 'mongoose';

interface CustomerCardAttrs {
  customer: string;
  number: { iv: string; content: string };
  exp_month: string;
  exp_year: string;
  cvc: { iv: string; content: string };
  last4: string;
  brand: string;
  country: string;
  stripeCardId: string;
  stripeCustomerId: string;
  clientIp: string;
  token: string[];
}

interface CustomerCardDoc extends mongoose.Document {
  id: string;
  customer: string;
  number: { iv: string; content: string };
  exp_month: string;
  exp_year: string;
  cvc: { iv: string; content: string };
  last4: string;
  brand: string;
  country: string;
  stripeCardId: string;
  stripeCustomerId: string;
  clientIp: string;
  token: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

interface CustomerCardModel extends mongoose.Model<CustomerCardDoc> {
  build(attrs: CustomerCardAttrs): CustomerCardDoc;
}

const CustomerCardSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    number: {
      iv: {
        type: String,
        required: true,
        unique: true,
      },
      content: {
        type: String,
        required: true,
        unique: true,
      },
    },
    exp_month: {
      type: String,
      required: true,
      uniq: true,
      trim: true,
    },
    exp_year: {
      type: String,
      required: true,
      uniq: true,
      trim: true,
    },
    cvc: {
      iv: {
        type: String,
        required: true,
        unique: true,
      },
      content: {
        type: String,
        required: true,
        unique: true,
      },
    },
    last4: {
      type: Number,
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    stripeCardId: {
      type: String,
      required: true,
      trim: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      trim: true,
    },
    clientIp: {
      type: String,
      trim: true,
    },
    token: {
      type: Array,
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

CustomerCardSchema.statics.build = (attrs: CustomerCardAttrs) => {
  return new CustomerCard(attrs);
};

const CustomerCard = mongoose.model<CustomerCardDoc, CustomerCardModel>(
  'CustomerCard',
  CustomerCardSchema
);

export { CustomerCard };
