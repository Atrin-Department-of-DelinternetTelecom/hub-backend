import jwt, { JwtPayload } from 'jsonwebtoken';

import { AccessDeniedError } from './index';
import { Authenticated } from './types';
import Axes from '@api/service/3th-party/Axes';
import { Gate } from '@lib/sdk';
import { JWT_TYPE } from '@api/constants/enum';
import { User } from '@models/global/global_users';
import config from '@config';
import { syncIntranetUsers } from '@api/service/global/UserService';
import { system } from '@models';
import to from 'await-to-js';

const { AclRole } = system;

const secret = config.get<string>('index.jwt.secret');

/**
 * Promisified version of jwt.verify
 */
function verify(token: string) {
  return new Promise<any>((resolve, reject) => {
    jwt.verify(token, secret, (err: any, decoded: any) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

const attemptUsingLocal = async (token: string): Promise<Authenticated> => {
  const [error, decoded] = await to(verify(token));

  if (error) {
    throw new AccessDeniedError();
  }

  if (decoded.type === JWT_TYPE.ACCESS_TOKEN) {
    return { user: await getUser(decoded), payload: decoded };
  }

  const id = decoded?.id;
  const email = decoded?.email;

  if (!id || !email) {
    throw new AccessDeniedError();
  }

  const user = await User.findOne({
    where: { id: decoded.id, email: decoded.email },
    include: { model: AclRole, as: 'role_item' },
  });

  if (!user?.enable) throw new AccessDeniedError();

  return { user, payload: decoded };
};

const attemptUsingAuthService = async (
  token: string,
): Promise<Authenticated> => {
  const decoded = jwt.verify(token, config.get<string>('auth.public_key'), {
    algorithms: ['RS256'],
  }) as JwtPayload;

  if (await Gate.isRevoked(decoded)) {
    throw new AccessDeniedError();
  }

  const user = await getUser(decoded);
  // ensure users are of the same type
  if (user && decoded.type && user.user_type !== decoded.type) {
    console.debug(user.user_type, decoded);
    await user.update({
      user_type: decoded.type,
    });
  }

  if (user) {
    return {
      user,
      payload: decoded,
    };
  }

  await createUserFromAuth(decoded);

  return {
    user: await getUser(decoded),
    payload: decoded as JwtPayload,
  };
};

export const createUserFromAuth = async (payload: JwtPayload) => {
  console.error('Creating new user from auth!', payload);

  const [error, axesUser] = await to(Axes.findUser(payload.id));

  if (error) {
    console.error('Error while fetching user from axes!', error);

    throw error;
  }

  console.debug('Creating local user from axes user!');

  const [failed, user] = await to(
    User.findOne({ where: { username: axesUser.username } }),
  );

  if (failed) {
    console.error('Trying to find by username failed!', failed);

    throw failed;
  }

  if (user) {
    console.error('User found by username!');
    await user.update({
      userId: axesUser.userId,
      enable: axesUser.active,
      user_type: axesUser.userType,
    });

    return user;
  }

  const password = Date.now().toString();
  const [fails, localUser] = await to(
    User.create({
      email: axesUser.email,
      userId: axesUser.userId,
      username: axesUser.email,
      enable: axesUser.active,
      user_type: axesUser.userType,
      first_name: 'New',
      last_name: axesUser.userType,
      password,
    }),
  );

  if (fails) {
    console.error('Error while creating user from axes!', fails);

    throw fails;
  }

  console.debug('Sync intranet users!');

  const [syncError] = await to(syncIntranetUsers(localUser, { password }));

  if (syncError) {
    console.error('Error while syncing intranet users!', syncError);

    throw syncError;
  }

  console.debug('A new user created from Axes user!');

  return localUser;
};

const getUser = async (payload: JwtPayload): Promise<User> => {
  //TODO: I don't know here really is forced to have a user or not
  //@ts-ignore
  return User.findOne({
    where: { user_id: payload.userId },
    include: { model: AclRole, as: 'role_item', required: false },
  });
};

export const authenticate = async (token: any): Promise<Authenticated> => {
  const [error, user] = await to(attemptUsingAuthService(token));

  if (error) {
    console.debug(`Authenticating with 'auth' failed: ${error.message}!`);
    return attemptUsingLocal(token);
  }

  return user;
};
