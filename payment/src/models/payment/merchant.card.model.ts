import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface merchantCardAttrs {
  merchant: string;
  number: { iv: string; content: string };
  exp_month: string;
  exp_year: string;
  cvc: { iv: string; content: string };
  currency: string;
  last4: string;
  brand: string;
  country: string;
  capabilities: string;
  stripeCardId: string;
  stripeAccountId: string;
  account_link_url: string;
  clientIp: string;
  token: string[];
}

interface merchantCardDoc extends mongoose.Document {
  id: string;
  merchant: string;
  number: { iv: string; content: string };
  exp_month: string;
  exp_year: string;
  cvc: { iv: string; content: string };
  last4: string;
  brand: string;
  currency: string;
  capabilities: string;
  country: string;
  stripeCardId: string;
  stripeAccountId: string;
  clientIp: string;
  account_link_url: string;
  transfer: {}[];
  token: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

interface merchantCardModel extends mongoose.Model<merchantCardDoc> {
  build(attrs: merchantCardAttrs): merchantCardDoc;
}

const merchantCardSchema = new mongoose.Schema(
  {
    merchant: {
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

    currency: {
      type: String,
      required: true,
      trim: true,
    },

    capabilities: {
      type: String,
      trim: true,
      default: 'inactive',
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

    stripeAccountId: {
      type: String,
      required: true,
      trim: true,
    },

    stripeCardId: {
      type: String,
      required: true,
      trim: true,
    },

    clientIp: {
      type: String,
      trim: true,
    },

    account_link_url: {
      type: String,
      required: true,
      trim: true,
    },

    transfer: {
      type: Array,
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

merchantCardSchema.set('versionKey', 'version');
merchantCardSchema.plugin(updateIfCurrentPlugin);

merchantCardSchema.statics.build = (attrs: merchantCardAttrs) => {
  return new MerchantCard(attrs);
};

const MerchantCard = mongoose.model<merchantCardDoc, merchantCardModel>(
  'MerchantCard',
  merchantCardSchema
);

export { MerchantCard };
