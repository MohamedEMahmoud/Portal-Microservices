import mongoose from 'mongoose';

interface BrandAttrs {
  name: string;
  slug: string;
  logo: string;
}

interface BrandDoc extends mongoose.Document {
  name: string;
  slug: string;
  logo: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface BrandModel extends mongoose.Model<BrandDoc> {
  build(attrs: BrandAttrs): BrandDoc;
}

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand required'],
      unique: [true, 'Brand must be unique'],
      minlength: [3, 'Too short brand name'],
      maxlength: [32, 'Too long brand name'],
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    logo: {
      type: String,
      required: true,
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

brandSchema.statics.build = (attrs: BrandAttrs) => {
  return new Brand(attrs);
};

const Brand = mongoose.model<BrandDoc, BrandModel>('Brand', brandSchema);

export { Brand };
