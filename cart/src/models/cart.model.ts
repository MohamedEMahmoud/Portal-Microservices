import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface CartAttrs {
  customer: string;
  cartItems: {
    product: string;
    quantity?: number;
    price: number;
  }[];
}

interface CartDoc extends mongoose.Document {
  customer: string;
  cartItems: {
    product: string;
    quantity: number;
    price: number;
  }[];
  totalCartPrice: number;
  totalPriceAfterDiscount: number | undefined;
  orderId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface CartModel extends mongoose.Model<CartDoc> {
  build(attrs: CartAttrs): CartDoc;
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
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },

        quantity: {
          type: Number,
          default: 1,
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

    orderId: {
      type: String,
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

cartSchema.statics.build = (attrs: CartAttrs) => {
  return new Cart(attrs);
};

const Cart = mongoose.model<CartDoc, CartModel>('Cart', cartSchema);

export { Cart };
