import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface ProductAttrs {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  thumbnail: string;
  images?: { id: string; URL: string }[];
  price: number;
  isUsed: boolean;
  isAvailable: boolean;
  version: number;
}

interface ProductDoc extends mongoose.Document {
  id: string;
  merchantId: string;
  images: { id: string; URL: string }[];
  thumbnail: string;
  title: string;
  description: string;
  price: number;
  isUsed: boolean;
  isAvailable: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductModel extends mongoose.Model<ProductDoc> {
  build(attrs: ProductAttrs): ProductDoc;
  findByEvent(event: {
    id: string;
    version: number;
  }): Promise<ProductDoc | null>;
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

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
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

productSchema.statics.findByEvent = (event: {
  id: string;
  version: number;
}) => {
  return Product.findOne({ id: event.id, version: event.version - 1 });
};

productSchema.statics.build = (attrs: ProductAttrs) => {
  return new Product({ _id: attrs.id, ...attrs });
};

const Product = mongoose.model<ProductDoc, ProductModel>(
  'Product',
  productSchema
);

export { Product };
