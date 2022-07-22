import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface OrderAttrs {
  id: string;
  customer: string;
  cartItems: {
    product: string;
    quantity: number;
    price: number;
  }[];
  shippingAddress: {
    name: string;
    address: string;
    phone: string;
    city: string;
    country: string;
    postalCode: string;
  };
  totalOrderPrice: number;
  deliveredAt: string;
  version: number;
}

export interface OrderDoc extends mongoose.Document {
  id: string;
  customer: string;
  cartItems: {
    product: string;
    quantity: number;
    price: number;
  }[];
  taxPrice: number;
  shippingAddress: {
    name: string;
    address: string;
    phone: string;
    city: string;
    country: string;
    postalCode: string;
  };
  shippingPrice: number;
  totalOrderPrice: number;
  deliveredAt: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
  findByEvent(event: { id: string; version: number }): Promise<OrderDoc | null>;
}

const orderSchema = new mongoose.Schema(
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

    taxPrice: {
      type: Number,
      default: 0,
    },

    shippingAddress: {
      name: String,
      address: String,
      phone: String,
      city: String,
      country: String,
      postalCode: String,
    },

    shippingPrice: {
      type: Number,
      default: 0,
    },

    totalOrderPrice: {
      type: Number,
    },

    deliveredAt: {
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

orderSchema.set('versionKey', 'version');
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return Order.findOne({ id: event.id, version: event.version - 1 });
};

orderSchema.statics.build = (attrs: OrderAttrs) => {
  return new Order({ _id: attrs.id, ...attrs });
};

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order };
