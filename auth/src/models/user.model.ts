import { Password } from '../services/Password.services';
import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { GenderType, RolesType } from '@portal-microservices/common';

interface UserAttrs {
  username: string;
  email?: string;
  password?: string;
  gender?: GenderType;
  profilePicture?: string;
  age?: number;
  phone?: string;
  role?: RolesType;
  macAddress?: { MAC: string }[];
  activeKey?: string;
  googleId?: string;
  facebookId?: string;
}

interface UserDoc extends mongoose.Document {
  email?: string;
  username: string;
  password?: string;
  gender?: GenderType;
  profilePicture: string;
  age?: number;
  phone?: string;
  role: RolesType;
  macAddress?: { MAC: string }[];
  version: number;
  activeKey: string;
  active: boolean;
  resetPasswordToken: string;
  resetPasswordExpires: string;
  otpCode: number;
  otpCodeExpires: string;
  googleId?: string;
  facebookId?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
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
      trim: true,
      unique: true,
      max: 50,
      lowercase: true,
    },

    password: {
      type: String,
      minlength: [8, 'Password must be more than 8 characters'],
    },

    gender: {
      type: String,
      trim: true,
      lowercase: true,
      enum: Object.values(GenderType),
    },

    profilePicture: {
      type: String,
    },

    age: {
      type: Number,
      trim: true,
      min: 15,
    },

    phone: {
      type: Number,

      trim: true,
    },

    role: {
      type: String,
      enum: Object.values(RolesType),
      default: RolesType.Customer,
    },

    macAddress: {
      type: Array,
    },

    activeKey: {
      type: String,
    },

    active: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpires: {
      type: Date,
    },
    otpCode: {
      type: Number,
    },

    otpCodeExpires: {
      type: Date,
    },

    googleId: {
      type: String,
    },

    facebookId: {
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
  }
);

userSchema.set('versionKey', 'version');
userSchema.plugin(updateIfCurrentPlugin);

userSchema.pre('save', async function (done) {
  if (this.isModified('password')) {
    const hashed = await Password.toHash(this.get('password'));
    this.set('password', hashed);
  }

  done();
});

userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };
