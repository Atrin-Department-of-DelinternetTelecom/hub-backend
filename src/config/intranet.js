'use strict';

module.exports = {
  disableCrmContracts: false,

  /**
   * Aire code that stands for business clients.
   */
  aireBusinessCode: process.env.AIRE_BUSINESS_CODE ?? 1,

  /**
   * Impersonate path at `my.delinternet.com`. the TOKEN will replace by the generated token.
   */
  impersonate_url:
    process.env.IMPERSONATE_URL ||
    'https://my.delinternet.com/impersonate/TOKEN',

  /**
   * IP version 6 subent of `my.delinternet.com`.
   */
  ipv6_subnet: process.env.IPV6_SUBNET ?? '2a10:22c0:c0de::/56',

  /**
   * Impersonate path at `my.delinternet.com`. the TOKEN will replace by the generated token.
   */
  satisfaction_form:
    process.env.SATISFACTION_FORM ||
    'https://delinternet.com/ca/forma-de-satisfaccio/ID',
};
