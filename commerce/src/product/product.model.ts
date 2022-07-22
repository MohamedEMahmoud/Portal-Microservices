import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { Review } from '../review/review.model';

interface ProductAttrs {
  merchantId: string;
  title: string;
  description: string;
  thumbnail: string;
  images?: { id: string; URL: string }[];
  price: number;
  category: string;
  brand: string;
}

interface ProductDoc extends mongoose.Document {
  merchantId: string;
  images: { id: string; URL: string }[];
  thumbnail: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  isUsed: boolean;
  isAvaliable: boolean;
  category: string;
  brand: string;
  avgRating: number;
  reviews: {
    customer: string;
    product: string;
    comment: string;
    rating: number;
  }[];
  calculateAvgRating(): number;
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

    isUsed: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },

    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],

    avgRating: {
      type: Number,
      default: 0,
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

productSchema.pre('remove', async function () {
  await Review.remove({ id: { $in: this.reviews } });
});

productSchema.methods.calculateAvgRating = function () {
  let ratingsTotal = 0;
  if (this.reviews.length) {
    this.reviews.forEach((review: { rating: number }) => {
      ratingsTotal += review.rating;
    });

    this.avgRating = Math.round((ratingsTotal / this.reviews.length) * 10) / 10;
  } else {
    this.avgRating = ratingsTotal;
  }
  const floorRating = Math.floor(this.avgRating);
  this.save();
  return floorRating;
};

const Product = mongoose.model<ProductDoc, ProductModel>(
  'Product',
  productSchema
);

export { Product };
