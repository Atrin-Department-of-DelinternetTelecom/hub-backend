import Queue, { Job } from 'bull';
import config from '@config';
import * as socket from '@lib/socket';
import { URL } from 'url';

const queues = config.get<Record<string, string>>('index.bull.queues');
const REDIS_URL = new URL(config.get('index.redis.url'));

export const getBullQ = (name: string) => {
  return new Queue(queues[name], {
    redis: { host: REDIS_URL.hostname, port: Number(REDIS_URL.port) },
  });
};

/**
 * publish a data to attached websocket ( specify by user id)
 */
export const wsJobData = (job: Job, data: unknown) => {
  const { _meta } = job.data;

  //entity contains id,model or page
  const { _user } = _meta;
  delete _meta._user;
  socket.emit('response', { ..._meta, data }, _user.id);
};
