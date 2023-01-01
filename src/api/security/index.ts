import {
  SwaggerSecurityError,
  SwaggerSecurityHandler,
  SwaggerSecurityOptions,
} from '@erfanium/swagger-tools';

import { User as Auth } from '@del-internet/sdk-auth';
import { Request } from 'express';
import { SecurityHandler } from './types';
import { User } from '@models/global/global_users';
import { getUrl } from '@utils/url';
import { temporaryTokenSecurityHandler } from './temporary_token';
import { tokenSecurityHandler } from './token';

export class AccessDeniedError implements SwaggerSecurityError {
  code = '403';
  message = 'Error: Access Denied';
  statusCode = 403;
}

function callbackify(handler: SecurityHandler): SwaggerSecurityHandler {
  return async (_req, def, scopes, cb) => {
    const req = _req as Request & { user?: User };
    try {
      const users = await handler(getUrl(req), def, scopes);
      if (users) {
        req.user = users.user;
        req.auth = users.payload as Auth;
      }
      cb();
    } catch (e) {
      if (e instanceof AccessDeniedError) {
        return cb(e);
      }
      cb({
        statusCode: 500,
        code: '500',
        message: 'Internal Server Error',
      });
      throw e;
    }
  };
}

export const options: SwaggerSecurityOptions = {
  Bearer: callbackify(tokenSecurityHandler),
  Token: callbackify(tokenSecurityHandler),
  TemporaryToken: callbackify(temporaryTokenSecurityHandler),
};
