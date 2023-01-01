'use strict';

const axios = require('axios').default;
const { Telegram } = require('@config/unpaid');

/**
 * @typedef {import('./Message.js').Message} Message
 */

const axiosInstance = axios.create({
  baseURL: Telegram.API,
  headers: {
    Authorization: `Bearer ${Telegram.AUTH_TOKEN}`,
  },
});

exports.Telegram = class Telegram {
  constructor() {
    this.type = 'telegram';
    this.isSent = false;
    this.reason = {};

    this.provider_message_id = null;
  }

  /**
   *
   * @param {Message} message
   */
  async send(message) {
    try {
      const res = await axiosInstance.post(
        `/telegram/send_message`,
        message.getMessage(),
      );
      this.isSent = true;
      this.response = res;
    } catch (err) {
      console.log(err);
      this.isSent = false;
      this.response = err;
    }
  }

  wasMessageSent() {
    return this.isSent;
  }

  getType() {
    return this.type;
  }
};
