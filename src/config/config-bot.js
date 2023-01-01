'use strict';

module.exports = {
  /**
   * Config bot base api endpoint.
   */
  endpoint: process.env.CONFIG_BOT_ENDPOINT ?? 'http://localhost:8002/',
  /**
   * Config bot api token.
   */
  token: process.env.CONFIG_BOT_TOKEN,
};
