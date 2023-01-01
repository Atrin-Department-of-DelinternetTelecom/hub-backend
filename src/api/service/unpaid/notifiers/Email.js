'use strict';

const { getTransporter, senders } = require('@lib/mailer');
const path = require('path');
const ejs = require('ejs');
const config = require('@config');
const templates = config.get('index.templates');

exports.Email = class Email {
  constructor() {
    this.type = 'email';
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
    const { email, message, first_name, last_name } = messageObj.getMessage();

    try {
      if (!email || !validateEmail(email)) throw new Error('Invalid email');
      const html = await buildEmailTemplate({
        text: message,
        title: 'factura impagada',
        businessName: `${first_name} ${last_name}`,
      });
      await getTransporter().sendMail({
        from: senders.invoice,
        to: email,
        subject: 'factura impagada',
        html,
      });
      this.isSent = true;
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

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function buildEmailTemplate(info) {
  const body = await ejs.renderFile(
    path.resolve(`${templates}/email`, 'basic.ejs'),
    info,
  );
  return body;
}
