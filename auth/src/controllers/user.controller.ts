import { Request, Response } from 'express';
import _ from 'lodash';
import jwt from 'jsonwebtoken';
import { v2 as Cloudinary } from 'cloudinary';
import {
  BadRequestError,
  GenderType,
  ProfilePictureType,
  RolesType,
} from '@portal-microservices/common';
import { User } from '../models/user.model';
import { randomBytes } from 'crypto';
import { Password } from '../services/Password.services';
import sendMail from '../services/messages.services';
import getNetworkAddress from '../services/address.services';
import mongoose from 'mongoose';

/**
 * Sign UP controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const signUp = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const { email, username } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new BadRequestError('Email in use!');
  }

  const existUsername = await User.findOne({ username });
  if (existUsername) {
    throw new BadRequestError('Username is already exists.');
  }

  let user = User.build({ ...req.body });

  if (files.profilePicture) {
    await new Promise((resolve, reject) => {
      Cloudinary.uploader
        .upload_stream(
          {
            public_id: `profile-picture/Portal-${user.username}`,
            use_filename: true,
            tags: `${user.username}-tag`,
            width: 500,
            height: 500,
            crop: 'scale',
            placeholder: true,
            resource_type: 'auto',
          },
          async (err, result) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              user.profilePicture = result?.secure_url!;
              resolve(user!.profilePicture);
            }
          }
        )
        .end(files.profilePicture[0].buffer);
    });
  } else {
    if (user.gender === GenderType.Male) {
      user.profilePicture = ProfilePictureType.Male;
    } else {
      user.profilePicture = ProfilePictureType.Female;
    }
  }

  user.macAddress.push({ MAC: String(getNetworkAddress().MAC) });

  let activeKey = randomBytes(8).toString('hex');
  const mail: { success: boolean; message: string } | undefined =
    await sendMail({
      email: user.email,
      username: user.username,
      activeKey: activeKey,
      type: 'signup',
    });

  if (mail!.success) {
    user.activeKey = activeKey;
    // generate JWT and then store it on session object
    generateToken(req, user.id);

    await user.save();

    res.status(201).send({ status: 201, user, success: true });
  }
};

/**
 * Sign in controller; enable sign with email or username
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new BadRequestError('Invalid credentials');
  }

  const passwordMatch = await Password.compare(user.password, password);

  if (!passwordMatch) {
    throw new BadRequestError('Invalid credentials');
  }

  if (
    !user.macAddress
      .map((addr) => addr.MAC)
      .includes(String(getNetworkAddress().MAC))
  ) {
    user.macAddress.push({ MAC: String(getNetworkAddress().MAC) });
  }

  // generate JWT and then store it on session object
  generateToken(req, user.id);

  res.status(200).send({ status: 200, user, success: true });
};

const generateToken = (req: Request, id: string) => {
  const userJwt = jwt.sign({ id }, process.env.JWT_KEY!);
  req.session = { jwt: userJwt };
};
/**
 * Sign out controller by deleting his session
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const signOut = async (req: Request, res: Response): Promise<void> => {
  req.session = null;
  res.send({ status: 204, message: 'Successfully signOut', success: true });
};

/**
 * Update user profile controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const updateUser = async (req: Request, res: Response): Promise<void> => {
  if (req.body.age < 15) {
    throw new BadRequestError('Invalid age');
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (files.profilePicture) {
    await new Promise((resolve, reject) => {
      Cloudinary.uploader
        .upload_stream(
          {
            public_id: `profilePicture/Portal-${req.user.username}`,
            use_filename: true,
            tags: `${req.user.username}-tag`,
            width: 500,
            height: 500,
            crop: 'scale',
            placeholder: true,
            resource_type: 'auto',
          },
          async (err, result) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              req.user!.profilePicture = result?.secure_url!;
              resolve(req.user!.profilePicture);
            }
          }
        )
        .end(files.picture[0].buffer);
    });
  }

  _.extend(req.user, req.body);
  await req.user.save();

  res.status(200).send({ status: 200, user: req.user, success: true });
};

/**
 * Return Current User controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  res
    .status(req.currentUser ? 200 : 400)
    .send({ currentUser: req.currentUser || null });
};

/**
 * Delete user account controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findByIdAndDelete(req.currentUser!.id);

  if (!user) {
    throw new BadRequestError('User is not found!');
  }

  req.session = null;

  res
    .status(200)
    .send({ status: 200, message: 'Deleted Successfully.', success: true });
};

/**
 * Get all users expect admin controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const allUsers = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.currentUser!.id);
  if (!user) {
    throw new BadRequestError('User not found.');
  }

  if (user?.role !== RolesType.Admin) {
    throw new BadRequestError("you don't have permission to show users");
  }

  const users = await User.find({});

  const filteredUsers = users.filter((user) => user.role !== 'admin');

  if (!filteredUsers) {
    throw new BadRequestError('there is no users!');
  }

  res.status(200).send({ status: 200, filteredUsers, success: true });
};

/**
 * Delete users by admin controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const deleteUsersByAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(String(req.query.id))) {
    throw new BadRequestError('id is invalid');
  }

  if (!req.query.id) {
    throw new BadRequestError('id query is required');
  }
  let user = await User.findById(req.currentUser!.id);
  if (!user) {
    throw new BadRequestError('User not found.');
  }

  if (user?.role !== RolesType.Admin) {
    throw new BadRequestError("you don'\t have permission to do this action");
  }

  user = await User.findByIdAndDelete(req.query.id);

  if (user?.role === RolesType.Admin) {
    throw new BadRequestError(
      "you don'\t have permission to do this action because this user is also admin"
    );
  }

  if (!user) {
    throw new BadRequestError('user not found!');
  }

  res.send({
    status: 200,
    message: 'Successfully Deleted User.',
    success: true,
  });
};

/**
 * Activation user account controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const userActive = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.currentUser!.id);
  if (!user) {
    throw new BadRequestError('user not exist');
  }

  if (!req.body.activeKey) {
    throw new BadRequestError('Active Key Is Required');
  }

  if (req.body.activeKey !== user.activeKey) {
    throw new BadRequestError('active key is invalid');
  }

  user.active = true;
  await user.save();

  res.status(200).send({ status: 200, user, success: true });
};

/**
 * Forget password controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const forgetPassword = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    throw new BadRequestError('Invalid Email');
  }

  const resetPasswordToken = randomBytes(8).toString('hex');

  const mail: { success: boolean; message: string } | undefined =
    await sendMail({
      email: user.email,
      username: user.username,
      resetPasswordToken: resetPasswordToken,
      type: 'forgottenPassword',
    });

  if (mail!.success) {
    user.resetPasswordToken = resetPasswordToken;
    const time = Date.now() + Number(process.env.RESET_PASSWORD_EXPIRATION_KEY);
    user.resetPasswordExpires = new Date(time).toISOString();
    await user.save();

    res.status(200).send({
      status: 200,
      user,
      message: 'Email Sent Successfully',
      success: true,
    });
  }
};

/**
 * Check password token controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const checkPasswordToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = await User.findOne({ email: req.query.email });
  if (!user) {
    throw new BadRequestError('user is no exist');
  }

  if (req.body.resetPasswordToken) {
    if (new Date() > new Date(user.resetPasswordExpires)) {
      throw new BadRequestError('reset password token Is Expired');
    }

    if (user.resetPasswordToken !== req.body.resetPasswordToken) {
      throw new BadRequestError('reset password token Is Invalid');
    }

    res.status(200).send({ status: 200, user, success: true });
  } else {
    throw new BadRequestError('reset password token is required');
  }
};

/**
 * Reset password controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const resetNewPassword = async (req: Request, res: Response): Promise<void> => {
  if (!req.body.password) {
    throw new BadRequestError('Password is required!');
  }
  await req.user.save();

  res.status(200).send({
    status: 200,
    user: req.user,
    message: 'reset password successfully.',
    success: true,
  });
};

/**
 * Resend password controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const resendKey = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findOne({ email: req.query.email });
  if (!user) {
    throw new BadRequestError('Invalid Email');
  }

  const resendKey = randomBytes(8).toString('hex');

  const mail: { success: boolean; message: string } | undefined =
    await sendMail({
      email: user.email,
      username: user.username,
      service: req.query.service,
      resendKey: resendKey,
      type: 'resendKey',
    });

  if (mail!.success) {
    if (req.query.service === 'reset-password') {
      user.resetPasswordToken = resendKey;
      const time =
        Date.now() + Number(process.env.RESET_PASSWORD_EXPIRATION_KEY);
      user.resetPasswordExpires = new Date(time).toISOString();
    } else {
      user.activeKey = resendKey;
    }

    await user.save();

    res
      .status(200)
      .send({ status: 200, user, message: 'Email Sent', success: true });
  }
};

/**
 * Change password controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { current_password, new_password, confirmation_password } = req.body;

  let user = await User.findOne({ email: req.query.email });

  if (!user) {
    throw new BadRequestError('User is not found!');
  }

  if (current_password) {
    if (new_password) {
      const specialCharactersValidator =
        /[ `!@#$%^&*()+\=\[\]{};':"\\|,.<>\/?~]/;
      if (
        new_password.includes('password') ||
        new_password.includes('asdf') ||
        new_password.length < 8
      ) {
        throw new BadRequestError('Password is too week.');
      }

      if (!specialCharactersValidator.test(new_password)) {
        throw new BadRequestError('Password must contain a special character.');
      }

      if (new_password.length < 8) {
        throw new BadRequestError('password must be more 8 characters');
      }

      let isTheSamePassword = await Password.compare(
        user.password,
        new_password
      );

      if (isTheSamePassword) {
        throw new BadRequestError(
          'Can not change password with the previous one'
        );
      }
    }

    if (new_password === confirmation_password) {
      const passwordValid = await Password.compare(
        user.password,
        current_password
      );
      console.log(passwordValid);
      if (passwordValid) {
        console.log('new encryption', await Password.toHash(new_password));
        user.password = await Password.toHash(new_password);
        console.log(user.password);
        console.log(new_password);
        await user.save();
        console.log('ch: ' + user?.password);
      } else {
        throw new BadRequestError('Current Password is Incorrect');
      }
    } else {
      throw new BadRequestError('Password and ConfirmPassword dose not Match.');
    }
  } else {
    throw new BadRequestError('CurrentPassword Field is required.');
  }

  res
    .status(200)
    .send({ status: 200, message: 'Password Change Successfully....' });
};

/**
 * Get otp verification code controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getOtpCode = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.query;
  const user = await User.findOne({ email });
  if (!user) {
    throw new BadRequestError('User not found.');
  }

  const otpCode = Math.floor(Math.random() * 90000);

  const mail: { success: boolean; message: string } | undefined =
    await sendMail({
      email: user.email,
      username: user.username,
      otpCode: otpCode,
      type: 'OTP',
    });

  if (mail!.success) {
    user.otpCode = otpCode;
    const time = Date.now() + Number(process.env.OTP_CODE_EXPIRATION);
    user.otpCodeExpires = new Date(time).toISOString();
    await user.save();
  }

  res.status(200).send({
    status: 200,
    message: 'OTP code sent Successfully',
    success: true,
  });
};

/**
 * two factor auth controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const twoFactorAuth = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.query;
  const user = await User.findOne({ email });
  if (!user) {
    throw new BadRequestError('User not found.');
  }

  if (!req.body.otpCode) {
    throw new BadRequestError('Otp verification code is required.');
  }

  if (
    user.otpCode !== Number(req.body.otpCode) ||
    new Date() > new Date(user.otpCodeExpires)
  ) {
    throw new BadRequestError('Otp Code Is Invalid');
  }

  res.status(200).send({ status: 200, user, success: true });
};

/**
 * Get Login Page controller
 * @param _req
 * @param res
 * @return {Promise<void>}
 */
const getGoogleLogin = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).send({ status: 200, success: true });
};

const getGoogleCallback = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.status(200).send({ status: 200, success: true });
};

export {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  updateUser,
  userActive,
  changePassword,
  checkPasswordToken,
  deleteUser,
  forgetPassword,
  resendKey,
  resetNewPassword,
  getOtpCode,
  twoFactorAuth,
  getGoogleLogin,
  getGoogleCallback,
  allUsers,
  deleteUsersByAdmin,
};
