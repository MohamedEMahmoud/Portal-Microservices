import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface accountAttrs {
  merchant: string;
  account_number: { iv: string; content: string };
  routing_number: number;
  bank_name: string;
  currency: string;
  country: string;
  capabilities: string;
  stripeBankAccountId: string;
  stripeAccountId: string;
  last4: string;
  account_link_url: string;
  clientIp: string;
  token: string[];
}

interface accountDoc extends mongoose.Document {
  id: string;
  merchant: string;
  account_number: { iv: string; content: string };
  routing_number: number;
  bank_name: string;
  currency: string;
  country: string;
  capabilities: string;
  last4: string;
  stripeBankAccountId: string;
  stripeAccountId: string;
  account_link_url: string;
  transfer: {}[];
  clientIp: string;
  token: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

interface accountModel extends mongoose.Model<accountDoc> {
  build(attrs: accountAttrs): accountDoc;
}

const accountSchema = new mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    account_number: {
      iv: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
    },

    routing_number: {
      type: Number,
      required: true,
      uniq: true,
      trim: true,
    },

    bank_name: {
      type: String,
      required: true,
      uniq: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    last4: {
      type: String,
      required: true,
      trim: true,
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

    stripeBankAccountId: {
      type: String,
      required: true,
      trim: true,
    },

    stripeAccountId: {
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

accountSchema.set('versionKey', 'version');
accountSchema.plugin(updateIfCurrentPlugin);

accountSchema.statics.build = (attrs: accountAttrs) => {
  return new Account(attrs);
};

const Account = mongoose.model<accountDoc, accountModel>(
  'Account',
  accountSchema
);

export { Account };
