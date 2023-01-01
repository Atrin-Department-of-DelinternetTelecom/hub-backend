import * as Service from '@service/global/TemporaryLink';

import { AccessDeniedError } from './index';
import { SecurityHandler } from './types';

export const temporaryTokenSecurityHandler: SecurityHandler = async (
  url,
  def,
  token,
) => {
  if (!token) throw new AccessDeniedError();
  if (Array.isArray(token)) throw new AccessDeniedError();

  const link = await Service.get(token);
  if (!link) throw new AccessDeniedError();

  if (url.pathname !== link) throw new AccessDeniedError();
};
