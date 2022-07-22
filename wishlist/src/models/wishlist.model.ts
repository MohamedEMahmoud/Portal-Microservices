import mongoose from 'mongoose';

interface WishListAttrs {
  customer: string;
  wishlist: string[];
}

interface WishListDoc extends mongoose.Document {
  customer: string;
  wishlist: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

interface WishListModel extends mongoose.Model<WishListDoc> {
  build(attrs: WishListAttrs): WishListDoc;
}

const wishListSchema = new mongoose.Schema(
  {
    customer: {
      type: String,
      required: true,
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
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

wishListSchema.set('versionKey', 'version');

wishListSchema.statics.build = (attrs: WishListAttrs) => {
  return new WishList({
    ...attrs,
  });
};

const WishList = mongoose.model<WishListDoc, WishListModel>(
  'WishList',
  wishListSchema
);

export { WishList };
