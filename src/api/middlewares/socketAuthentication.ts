import { ExtendedError } from 'socket.io/dist/namespace';
import { Handshake } from 'socket.io/dist/socket';
import { Socket } from 'socket.io';
import { authenticate } from '../security/jwt';
import config from '@config';
import to from 'await-to-js';

function isAdmin(handshake: Handshake) {
  const username = handshake.auth?.username;
  const password = handshake.auth?.password;

  if (!username || !password) return false;

  return (
    username == config.get('socket-io.admin_user') &&
    password == config.get('socket-io.admin_pass')
  );
}

type Next = (err?: ExtendedError) => void;

export default async (socket: Socket, next: Next) => {
  if (isAdmin(socket.handshake)) return next();

  if (socket.handshake.query?.token) {
    const [error, users] = await to(
      // @ts-ignore
      authenticate(socket.handshake.query.token),
    );

    if (error) return next(error);

    const { user } = users;

    socket.data = user;

    // join socket to a room with its user id
    socket.join(String(user.id));
    return next();
  }

  next(new Error('Authentication error'));
};
