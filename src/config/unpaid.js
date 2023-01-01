'use strict';

module.exports = {
  SMS: {
    API: process.env.SMS_API || 'https://api.gateway360.com/api/3.0/sms',
    KEY: process.env.SMS_KEY,
    MESSAGE_FROM: process.env.SMS_FORM || 'Delinternet',
    enabled: false,
  },
  Telegram: {
    API: process.env.TELEGRAM_API || 'http://telegram.delinternet.com/api/v1',
    AUTH_TOKEN: process.env.TELEGRAM_AUTH_TOKEN || 'p2VLakUztE',
  },
  TASK_INTERVAL: 10 * 60 * 1000, // 10 minutes.
  CUT_TASK_INTERVAL: 24 * 60 * 60 * 1000, // 1 day
  CHANGE_FEE_SEND_TASK_INTERVAL: 24 * 60 * 60 * 1000, // 1 day
};
