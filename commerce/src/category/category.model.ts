import mongoose from 'mongoose';

interface CategoryAttrs {
  name: string;
  slug: string;
  image: string;
}

interface CategoryDoc extends mongoose.Document {
  name: string;
  slug: string;
  image: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryModel extends mongoose.Model<CategoryDoc> {
  build(attrs: CategoryAttrs): CategoryDoc;
}

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category required'],
      unique: [true, 'Category must be unique'],
      minlength: [3, 'Too short category name'],
      maxlength: [32, 'Too long category name'],
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    image: {
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

categorySchema.statics.build = (attrs: CategoryAttrs) => {
  return new Category(attrs);
};

const Category = mongoose.model<CategoryDoc, CategoryModel>(
  'Category',
  categorySchema
);

export { Category };
