import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface ProductAttrs {
  merchantId: string;
  title: string;
  description: string;
  thumbnail: string;
  images?: { id: string; URL: string; }[];
  price: number;
}

interface ProductDoc extends mongoose.Document {
  merchantId: string;
  images: { id: string; URL: string; }[];
  thumbnail: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  isUsed: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  orderId?: string;
}

interface ProductModel extends mongoose.Model<ProductDoc> {
  build(attrs: ProductAttrs): ProductDoc;
}

const productSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
    },

    images: {
      type: Array,
      default: [],
    },

    thumbnail: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      trim: true,
      required: true,
      min: 5,
      max: 50,
    },

    description: {
      type: String,
      trim: true,
      min: 20,
      max: 1000,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    orderId: {
      type: String,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        (ret.id = ret._id), delete ret._id, delete ret.password;
      },
    },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

productSchema.set('versionKey', 'version');
productSchema.plugin(updateIfCurrentPlugin);

productSchema.statics.build = (attrs: ProductAttrs) => {
  return new Product(attrs);
};

const Product = mongoose.model<ProductDoc, ProductModel>(
  'Product',
  productSchema
);

export { Product };
