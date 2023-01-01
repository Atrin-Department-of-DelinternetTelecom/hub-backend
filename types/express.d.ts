import { User } from '@del-internet/sdk-auth';
import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      auth?: User;
    }
  }
}
