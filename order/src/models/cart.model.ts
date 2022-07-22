import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface CartAttrs {
  id: string;
  customer: string;
  cartItems: {
    product: string;
    quantity?: number;
    price: number;
  }[];
  totalCartPrice: number;
  totalPriceAfterDiscount?: number;
  version: number;
}

interface CartDoc extends mongoose.Document {
  id: string;
  customer: string;
  cartItems: {
    product: string;
    quantity: number;
    price: number;
  }[];
  totalCartPrice: number;
  totalPriceAfterDiscount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface CartModel extends mongoose.Model<CartDoc> {
  build(attrs: CartAttrs): CartDoc;
  findByEvent(event: { id: string; version: number }): Promise<CartDoc | null>;
}

const cartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    cartItems: [
      {
        product: {
          type: String,
        },

        quantity: {
          type: Number,
        },

        price: {
          type: Number,
        },
      },
    ],

    totalCartPrice: {
      type: Number,
    },

    totalPriceAfterDiscount: {
      type: Number,
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

cartSchema.set('versionKey', 'version');
cartSchema.plugin(updateIfCurrentPlugin);

cartSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return Cart.findOne({ id: event.id, version: event.version - 1 });
};

cartSchema.statics.build = (attrs: CartAttrs) => {
  return new Cart({ _id: attrs.id, ...attrs });
};

const Cart = mongoose.model<CartDoc, CartModel>('Cart', cartSchema);

export { Cart };
