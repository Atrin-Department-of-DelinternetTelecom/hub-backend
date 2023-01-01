'use strict';

module.exports = {
  /**
   * API credentials for Ebra discovery service
   */
  endpoint: process.env.EBRA_API_ENDPOINT ?? 'https://ebra.dev.delinternet.com',

  token: process.env.EBRA_API_TOKEN ?? '',
};
