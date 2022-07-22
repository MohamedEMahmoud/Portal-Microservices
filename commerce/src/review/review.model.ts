import mongoose from 'mongoose';

interface ReviewAttrs {
  customer: string;
  product: string;
  comment: string;
  rating: number;
}

interface ReviewDoc extends mongoose.Document {
  customer: string;
  product: string;
  comment: string;
  rating: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface ReviewModel extends mongoose.Model<ReviewDoc> {
  build(attrs: ReviewAttrs): ReviewDoc;
}

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to user'],
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to product'],
    },

    comment: {
      type: String,
      trim: true,
    },

    rating: {
      type: Number,
      min: [1, 'Min ratings value is 1.0'],
      max: [5, 'Max ratings value is 5.0'],
      required: [true, 'review ratings required'],
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

reviewSchema.statics.build = (attrs: ReviewAttrs) => {
  return new Review(attrs);
};

const Review = mongoose.model<ReviewDoc, ReviewModel>('Review', reviewSchema);

export { Review };
