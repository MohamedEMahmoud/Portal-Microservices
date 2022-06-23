import { BadRequestError } from '@portal-microservices/common';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { Password } from '../services/Password.services';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const updatePassword = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const user = await User.findById(req.currentUser!.id);

  if (!user) {
    throw new BadRequestError('User is not found!');
  }

  if (req.body.password) {
    const specialCharactersValidator = /[ `!@#$%^&*()+\=\[\]{};':"\\|,.<>\/?~]/;
    if (
      req.body.password.includes('password') ||
      req.body.password.includes('asdf') ||
      req.body.password.length < 8
    ) {
      throw new BadRequestError('Password is too week.');
    }

    if (!specialCharactersValidator.test(req.body.password)) {
      throw new BadRequestError('Password must contain a special character.');
    }

    if (req.body.password.length < 8) {
      throw new BadRequestError('password must be more 8 characters');
    }

    let isTheSamePassword = await Password.compare(
      user.password!,
      req.body.password
    );

    if (isTheSamePassword) {
      throw new BadRequestError(
        'Can not change password with the previous one'
      );
    }

    user.password = req.body.password;
  }

  req.user = user;

  next();
};

export { updatePassword };
