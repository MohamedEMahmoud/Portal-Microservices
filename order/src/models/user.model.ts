import { RolesType } from '@portal-microservices/common';
import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface UserAttrs {
  id: string;
  username: string;
  email: string;
  profilePicture: string;
  role: RolesType;
}

interface UserDoc extends mongoose.Document {
  username: string;
  email: string;
  profilePicture: string;
  role?: RolesType;
  version: number;
  created_at: string;
  updated_at: string;
}

interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
  findByEvent(event: { id: string; version: number }): Promise<UserDoc | null>;
}

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: [8, 'Username must be more than 8 characters'],
      max: 20,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      max: 50,
      lowercase: true,
    },

    profilePicture: {
      type: String,
    },

    role: {
      type: String,
      enum: Object.values(RolesType),
      default: RolesType.Customer,
    },
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

userSchema.set('versionKey', 'version');
userSchema.plugin(updateIfCurrentPlugin);

userSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return User.findOne({ id: event.id, version: event.version - 1 });
};

userSchema.statics.build = (attrs: UserAttrs) => {
  return new User({
    _id: attrs.id,
    ...attrs,
  });
};

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };
