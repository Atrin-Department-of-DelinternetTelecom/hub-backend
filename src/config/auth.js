'use strict';

module.exports = {
  /**
   * Shared public key from the auth service
   */
  public_key: process.env.AUTH_PUBLIC_KEY ?? '',
  /**
   * API credentials.
   */
  api: {
    endpoint:
      process.env.AUTH_API_ENDPOINT ?? 'https://auth.dev.delinternet.com',
    username: process.env.AUTH_API_USERNAME ?? '',
    password: process.env.AUTH_API_PASSWORD ?? '',
  },
  /**
   * The auth redis service configuration.
   */
  redis: {
    host: process.env.AUTH_HOST ?? '127.0.0.1',
    port: process.env.AUTH_PORT ?? '6379',
    username: process.env.AUTH_USERNAME ?? 'local',
    password: process.env.AUTH_PASSWORD ?? 'L0c@Del',
    keyPrefix: process.env.REDIS_PREFIX ?? 'axes:',
  },
};
