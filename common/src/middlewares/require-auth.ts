import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/not-found-error';

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.currentUser) {
    throw new NotFoundError();
  }

  next();
};
