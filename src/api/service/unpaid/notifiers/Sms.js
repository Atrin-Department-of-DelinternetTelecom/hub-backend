'use strict';

const config = require('@config');
const { sendSingle } = require('@api/utils/smspubli');

exports.Sms = class Sms {
  constructor() {
    this.type = 'sms';
    this.isSent = false;
    this.reason = {};

    // this field is public
    this.provider_message_id = null;
  }

  /**
   * Send a Telegram message
   * @param {import('./Message').Message} messageObj
   */
  async send(messageObj) {
    const { phone, message } = messageObj.getMessage();

    try {
      const result = await sendSingle({
        to: phone.replace(/^\D+/g, ''),
        text: message,
      });
      if (result.status === 'ok') {
        this.isSent = true;
        this.provider_message_id = result.sms_id;
      }
    } catch (error) {
      console.error(error);
      this.isSent = false;
    }
  }

  wasMessageSent() {
    return this.isSent;
  }

  getType() {
    return this.type;
  }
};
