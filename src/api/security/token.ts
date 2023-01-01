import { AccessDeniedError } from './index';
import { SecurityHandler } from './types';
import { authenticate } from './jwt';

export const tokenSecurityHandler: SecurityHandler = async (
  url,
  def,
  token,
) => {
  if (!token) throw new AccessDeniedError();
  if (Array.isArray(token)) throw new AccessDeniedError();

  return authenticate(token);
};
