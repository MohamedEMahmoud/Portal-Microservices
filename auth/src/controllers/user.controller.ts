import { Request, Response } from 'express';
import _ from 'lodash';
import jwt from 'jsonwebtoken';
import { v2 as Cloudinary } from 'cloudinary';
import {
  BadRequestError,
  GenderType,
  ProfilePictureType,
  RolesType,
  LoggerService,
} from '@portal-microservices/common';
import { User } from '../models/user.model';
import { randomBytes } from 'crypto';
import { Password } from '../services/Password.services';
import sendMail from '../services/messages.services';
import getNetworkAddress from '../services/address.services';
import mongoose from 'mongoose';
import { client } from '../services/twilio.services';
import fs from 'fs';
import { natsWrapper } from '../nats-wrapper';
import { UserCreatedPublisher } from '../events/publishers/user-created-publisher';
import { UserUpdatedPublisher } from '../events/publishers/user-updated-publisher';
import { UserDeletedPublisher } from '../events/publishers/user-deleted-publisher';
let logger = new LoggerService('auth');

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
    logger.error(`Email : ${existingUser.email} is already exists`);
    throw new BadRequestError('Email in use!');
  }

  const existUsername = await User.findOne({ username });
  if (existUsername) {
    logger.error(`${existUsername.username} is already exists`);
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

  user.macAddress!.push({ MAC: String(getNetworkAddress().MAC) });

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

    const savedData = await user.save();
    if (savedData) {
      await new UserCreatedPublisher(natsWrapper.client).publish({
        id: user.id,
        email: String(user.email),
        username: user.username,
        profilePicture: user.profilePicture,
        role: user.role,
        version: user.version,
      });
    }

    logger.info(`${user.email} become a new user in the application`);

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
    logger.error('Invalid credentials');
    throw new BadRequestError('Invalid credentials');
  }

  const passwordMatch = await Password.compare(user.password!, password);

  if (!passwordMatch) {
    logger.error('Invalid credentials');
    throw new BadRequestError('Invalid credentials');
  }

  if (
    !user
      .macAddress!.map((addr) => addr.MAC)
      .includes(String(getNetworkAddress().MAC))
  ) {
    user.macAddress!.push({ MAC: String(getNetworkAddress().MAC) });
  }

  // generate JWT and then store it on session object
  generateToken(req, user.id);

  logger.info(`the user : ${user.email} successfull login in application`);
  res.status(200).send({ status: 200, user, success: true });
};

const generateToken = (req: Request, id: string) => {
  const userJwt = jwt.sign({ id }, process.env.JWT_KEY!);
  req.session.jwt = userJwt;
};
/**
 * Sign out controller by deleting his session
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const signOut = async (req: Request, res: Response): Promise<void> => {
  req.session.jwt = null;
  logger.info('successfull signOut');
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
    logger.error('Invalid age');
    throw new BadRequestError(`${req.body.age} is Invalid age`);
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
  const savedData = await req.user.save();
  if (savedData) {
    const bodyData: { [key: string]: string } = {};

    _.each(req.body, (value, key: string) => {
      const fields = ['email', 'username', 'profilePicture', 'role'];
      fields.forEach((el) => {
        if (key === el) {
          bodyData[key] = value;
        }
      });
    });

    await new UserUpdatedPublisher(natsWrapper.client).publish({
      id: savedData.id,
      ...bodyData,
      version: savedData.version,
    });
  }

  logger.info(`${req.user.email} update his information successfully`);

  res.status(200).send({ status: 200, user: req.user, success: true });
};

/**
 * Return Current User controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  logger.info(`${req.currentUser}`);
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
    logger.error(`User is not found.`);
    throw new BadRequestError('User is not found!');
  }

  req.session.jwt = null;
  await new UserDeletedPublisher(natsWrapper.client).publish({
    id: user.id,
  });
  logger.info(`${user.email} is deleted successfully...`);

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
  const currentPage: any = req.query.page || 1,
    perPage = 2;

  const user = await User.findById(req.currentUser!.id);
  if (!user) {
    logger.error(`User is not found.`);
    throw new BadRequestError('User not found.');
  }

  if (user?.role !== RolesType.Admin) {
    logger.error(
      `${user.email} try to show all users but don't have permission.`
    );
    throw new BadRequestError("you don't have permission to show users");
  }

  const count = await User.find({
    role: RolesType.Customer || RolesType.Merchant,
  }).countDocuments();
  const users = await User.find({})
    .sort({ created_at: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  const filteredUsers = users.filter((user) => user.role !== 'admin');

  if (!filteredUsers) {
    logger.error(`there is no users!`);
    throw new BadRequestError('there is no users!');
  }

  logger.infoObj(`all users `, users);
  res
    .status(200)
    .send({ status: 200, filteredUsers, totalItems: count, success: true });
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
    logger.error(`${req.query.id} is Invalid`);
    throw new BadRequestError('id is invalid');
  }

  if (!req.query.id) {
    logger.error(`${req.query.id} is required`);
    throw new BadRequestError('id query is required');
  }
  let user = await User.findById(req.currentUser!.id);
  if (!user) {
    logger.error(`User is not found.`);
    throw new BadRequestError('User not found.');
  }

  if (user?.role !== RolesType.Admin) {
    logger.error(`${user.email} try to delete user but don't have permission.`);
    throw new BadRequestError("you don't have permission to do this action");
  }

  user = await User.findByIdAndDelete(req.query.id);

  if (user?.role === RolesType.Admin) {
    logger.error(
      `${user.email} try to delete this user but this action don't performed because this is user is also admin`
    );
    throw new BadRequestError(
      "you don't have permission to do this action because this user is also admin"
    );
  }

  if (!user) {
    logger.error(`User is not found.`);
    throw new BadRequestError('user not found!');
  }

  await new UserDeletedPublisher(natsWrapper.client).publish({
    id: user.id,
  });

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
    logger.error(`User is not found.`);
    throw new BadRequestError('user not exist');
  }

  if (!req.body.activeKey) {
    logger.error('Active Key Is Required');
    throw new BadRequestError('Active Key Is Required');
  }

  if (req.body.activeKey !== user.activeKey) {
    logger.error(`this Active Key : ${req.body.activeKey} Is Invalid`);
    throw new BadRequestError('active key is invalid');
  }

  user.active = true;
  const savedData = await user.save();

  if (savedData) {
    await new UserUpdatedPublisher(natsWrapper.client).publish({
      id: savedData.id,
      version: savedData.version,
    });
  }

  logger.info(`${user.email} is activate account successfully`);
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
    logger.error(`${req.body.email} is Invalid Email`);
    throw new BadRequestError('Invalid Email');
  }

  const resetPasswordToken = randomBytes(8).toString('hex');

  if (req.query.service === 'MAIL') {
    const mail: { success: boolean; message: string } | undefined =
      await sendMail({
        email: user.email,
        username: user.username,
        resetPasswordToken: resetPasswordToken,
        type: 'forgottenPassword',
      });

    if (mail!.success) {
      user.resetPasswordToken = resetPasswordToken;
      const time =
        Date.now() + Number(process.env.RESET_PASSWORD_EXPIRATION_KEY);
      user.resetPasswordExpires = new Date(time).toISOString();
      const savedData = await user.save();

      if (savedData) {
        await new UserUpdatedPublisher(natsWrapper.client).publish({
          id: savedData.id,
          version: savedData.version,
        });
      }
      logger.info(
        `${user.email} is received resetPasswordToken successfully in gmail`
      );

      res.status(200).send({
        status: 200,
        user,
        message: 'Email Sent Successfully',
        success: true,
      });
    }
  } else if (req.query.service === 'SMS') {
    const message = await client.messages.create({
      body: `This is the resetPasswordToken : ${resetPasswordToken}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+19159969739`,
    });

    logger.info(
      `${user.email} is received resetPasswordToken successfully in phone`
    );
    res.status(200).send({
      status: 200,
      user,
      message,
      success: true,
    });
  } else {
    logger.info(`you must select one option to receive resetPasswordToken`);
    throw new BadRequestError(
      'you must select one option to receive resetPasswordToken'
    );
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
    logger.error('User in not found.');
    throw new BadRequestError('user is no exist');
  }

  if (req.body.resetPasswordToken) {
    if (new Date() > new Date(user.resetPasswordExpires)) {
      logger.error(
        `reset password token : ${user.resetPasswordExpires} Is Expired`
      );
      throw new BadRequestError('reset password token Is Expired');
    }

    if (user.resetPasswordToken !== req.body.resetPasswordToken) {
      logger.error(
        `reset password token in req.body : ${req.body.resetPasswordToken} don't equal to user reset password`
      );
      throw new BadRequestError('reset password token Is Invalid');
    }

    logger.info(
      `resetPasswordToken : ${req.body.resetPasswordToken} is Invalid`
    );
    res.status(200).send({ status: 200, user, success: true });
  } else {
    logger.error(`reset password token is required`);
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
    logger.error('Password is required!');
    throw new BadRequestError('Password is required!');
  }
  const savedData = await req.user.save();

  if (savedData) {
    await new UserUpdatedPublisher(natsWrapper.client).publish({
      id: savedData.id,
      version: savedData.version,
    });
  }
  logger.info(`${req.user.email} reset password successfully.`);

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
    logger.error(`${req.query.email} is Invalid Email`);
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

    const savedData = await user.save();
    if (savedData) {
      await new UserUpdatedPublisher(natsWrapper.client).publish({
        id: savedData.id,
        version: savedData.version,
      });
    }
    logger.info(`resend key is sent successfully to ${user.email}`);

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
    logger.error(`${req.query.email} is Invalid Email`);
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
        logger.error(`${new_password} Password is too week.`);
        throw new BadRequestError('Password is too week.');
      }

      if (!specialCharactersValidator.test(new_password)) {
        logger.error(
          `${new_password} Password is too week.must contain a special character.`
        );
        throw new BadRequestError('Password must contain a special character.');
      }

      if (new_password.length < 8) {
        logger.error(`${new_password} Password  must be more 8 characters.`);
        throw new BadRequestError('password must be more 8 characters.');
      }

      let isTheSamePassword = await Password.compare(
        user.password!,
        new_password
      );

      if (isTheSamePassword) {
        logger.error(
          `${isTheSamePassword} Can not change password with the previous one`
        );
        throw new BadRequestError(
          'Can not change password with the previous one'
        );
      }
    }

    if (new_password === confirmation_password) {
      const passwordValid = await Password.compare(
        user.password!,
        current_password
      );
      if (passwordValid) {
        user.password = new_password;
        const savedData = await user.save();
        if (savedData) {
          await new UserUpdatedPublisher(natsWrapper.client).publish({
            id: savedData.id,
            version: savedData.version,
          });
        }
        logger.info(`${user.email} change password successfully`);
      } else {
        logger.error(`${current_password} is Incorrect`);
        throw new BadRequestError('Current Password is Incorrect');
      }
    } else {
      logger.error('Password and ConfirmPassword dose not Match.');
      throw new BadRequestError('Password and ConfirmPassword dose not Match.');
    }
  } else {
    logger.error('CurrentPassword Field is required.');
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
    logger.error(`${req.query.email} is Invalid Email`);
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
    const savedData = await user.save();
    if (savedData) {
      await new UserUpdatedPublisher(natsWrapper.client).publish({
        id: savedData.id,
        version: savedData.version,
      });
    }
    logger.info(`${user.email} receive otpCode Successfully`);
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
    logger.error(`${req.query.email} is Invalid Email`);
    throw new BadRequestError('User not found.');
  }

  if (!req.body.otpCode) {
    logger.error('Otp verification code is required');
    throw new BadRequestError('Otp verification code is required.');
  }

  if (
    user.otpCode !== Number(req.body.otpCode) ||
    new Date() > new Date(user.otpCodeExpires)
  ) {
    logger.error('Otp verification code is Invalid');
    throw new BadRequestError('Otp Code Is Invalid');
  }

  logger.info(`${user.email} is pass otpCode valid.`);

  res.status(200).send({ status: 200, user, success: true });
};

/**
 * Get Login Page controller
 * @param _req
 * @param res
 * @return {Promise<void>}
 */
const getGoogleLogin = async (_req: Request, res: Response): Promise<void> => {
  logger.info('getGoogleLogin Successfully');
  res.status(200).send({ status: 200, success: true });
};

/**
 * Get Google Callback controller
 * @param _req
 * @param res
 * @return {Promise<void>}
 */
const getGoogleCallback = async (
  _req: Request,
  res: Response
): Promise<void> => {
  logger.info('getGoogleCallback Successfully');
  res.status(200).send({ status: 200, success: true });
};

/**
 * Get Facebook Callback controller
 * @param _req
 * @param res
 * @return {Promise<void>}
 */
const getFacebookCallback = async (
  _req: Request,
  res: Response
): Promise<void> => {
  logger.info('getFacebookCallback Successfully');
  res.status(200).send({ status: 200, success: true });
};

/**
 * Read logger files controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const logReader = async (req: Request, res: Response): Promise<void> => {
  let user = await User.findById(req.currentUser!.id);
  if (!user) {
    logger.error(`User is not found.`);
    throw new BadRequestError('User not found.');
  }

  if (user?.role !== RolesType.Admin) {
    logger.error(
      `${user.email} try to show logger file but he don't have permission.`
    );
    throw new BadRequestError("you don't have permission to do this action");
  }
  const data = fs
    .readFileSync(`${process.env.LOG_FILE_PATH}/${process.env.LOG_FILE_NAME}`, {
      encoding: 'utf8',
    })
    .split('\n')
    .filter((text) => text.length);

  res.send({
    status: 200,
    data,
    message: 'Successfully show logger file',
    success: true,
  });
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
  getFacebookCallback,
  logReader,
};
