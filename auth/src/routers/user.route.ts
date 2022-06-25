import express from 'express';
import {
  signUp,
  signIn,
  deleteUser,
  updateUser,
  userActive,
  signOut,
  forgetPassword,
  changePassword,
  resendKey,
  resetNewPassword,
  checkPasswordToken,
  getCurrentUser,
  getOtpCode,
  twoFactorAuth,
  getGoogleLogin,
  getGoogleCallback,
  allUsers,
  deleteUsersByAdmin,
  getFacebookCallback,
  logReader,
} from '../controllers/user.controller';
import {
  requireAuth,
  upload,
  validateUserSignUpData,
  validationPhoto,
  currentUser,
} from '@portal-microservices/common';
import { updatePassword } from '../middlewares/user.middleware';
import passport from 'passport';

const router = express.Router();

router.post(
  '/api/auth/signup',
  upload.fields([{ name: 'profilePicture', maxCount: 1 }]),
  validationPhoto,
  validateUserSignUpData,
  signUp
);

router.post('/api/auth/signin', upload.none(), signIn);

router.post('/api/auth/signout', upload.none(), signOut);

router.get('/api/auth/current-user', currentUser, getCurrentUser);

router.get('/api/auth/users', requireAuth, allUsers);

// router.get('/api/auth/logger', requireAuth, logReader);

router.patch(
  '/api/auth',
  [upload.fields([{ name: 'profilePicture', maxCount: 1 }])],
  requireAuth,
  validationPhoto,
  updatePassword,
  updateUser
);
router.patch(
  '/api/auth/change-password',
  upload.none(),
  requireAuth,
  changePassword
);

router.delete('/api/auth', upload.none(), requireAuth, deleteUser);

router.delete(
  '/api/auth/users',
  upload.none(),
  requireAuth,
  deleteUsersByAdmin
);

router.patch('/api/auth/active', upload.none(), requireAuth, userActive);

router.patch('/api/auth/forget-password', upload.none(), forgetPassword);

router.patch('/api/auth/resend-key', upload.none(), resendKey);

router.patch(
  '/api/auth/reset-password',
  upload.none(),
  updatePassword,
  resetNewPassword
);

router.patch(
  '/api/auth/check-password-token',
  upload.none(),
  checkPasswordToken
);

router.get('/api/auth/otp-code', upload.none(), getOtpCode);

router.post('/api/auth/verification-otp-code', upload.none(), twoFactorAuth);

router.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
  getGoogleLogin
);

router.get(
  '/api/auth/google/callback',
  passport.authenticate('google'),
  getGoogleCallback
);

router.get(
  '/api/auth/facebook/callback',
  passport.authenticate('facebook'),
  getFacebookCallback
);

export { router as usersRouter };
