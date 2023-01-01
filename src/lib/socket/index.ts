import Debug from 'debug';
import { Server as HttpServer } from 'http';
import { Namespace, Server, Socket } from 'socket.io';

const debug = Debug('socket');

const onlineUsers: Set<string> = new Set();

let namespace: Namespace | null = null;

type FirstArgType<T extends (...args: any) => any> = T extends (
  arg0: infer R,
  ...args: any
) => any
  ? R
  : any;

export const init = function (
  http: HttpServer,
  authMiddleware: FirstArgType<Namespace['use']>,
) {
  const server = new Server(http, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  const _namespace = server.of('/api');
  _namespace.use(authMiddleware);
  _namespace.on('connection', (socket) => {
    onlineUsers.add(String(socket.data.id));
    debug('new socket.io connection');

    socket.once('disconnect', () => {
      onlineUsers.delete(String(socket.data.id));
      debug('socket io disconnected');
    });
  });

  namespace = _namespace;
};

export const emit = (event: string | number, ...args: any[]) => {
  if (!namespace) {
    return console.warn(
      'socket.io server is not started yet. ignoring the emit',
    );
  }
  namespace.emit(String(event), ...args);
};

export const emitIn = (
  _room: string | number | string[] | number[],
  event: string,
  ...args: any[]
) => {
  const room = Array.isArray(_room) ? _room : [_room];
  if (!namespace) {
    return console.warn(
      'socket.io server is not started yet. ignoring the emit',
      new Error().stack,
    );
  }
  namespace.in(room.map((e) => String(e))).emit(event, ...args);
};

export const onConnection = (cb: (socket: Socket) => void) => {
  if (!namespace) {
    return console.warn(
      'socket.io server is not started yet. ignoring the onConnect',
      new Error().stack,
    );
  }
  namespace.on('connection', cb);
};

export const onEvent = (eventName: string, cb: (socket: Socket) => void) => {
  if (!namespace) {
    return console.warn(
      'socket.io server is not started yet. ignoring the onConnect',
      new Error().stack,
    );
  }
  namespace.on(eventName, cb);
};

export const isUserConnected = (id: string): boolean => {
  return onlineUsers.has(id);
};
