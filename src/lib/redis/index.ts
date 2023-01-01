import config from '@config';
import { createClient } from 'redis';

const url = config.get<string>('index.redis.url');

export const client = createClient({
  socket: {
    // increasing timeout for fix a timeout bug. see https://github.com/redis/node-redis/issues/1656
    connectTimeout: 30000,
  },
  url,
});

client.connect();
