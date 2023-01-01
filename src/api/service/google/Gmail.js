'use strict';

require('dotenv').config();

const { google } = require('googleapis');

const config = require('@config');

const assert = require('assert');

const getCredential = () => {
  return JSON.parse(config.get('index.emailConfig.credentials')).installed;
};

const getToken = () => {
  return JSON.parse(config.get('index.emailConfig.token'));
};

/**
 * @class
 */
exports.GoogleMail = class GoogleMail {
  static gmail = null;
  auth = null;
  constructor() {
    if (!this.auth) {
      const { client_id, client_secret, redirect_uris = [] } = getCredential();
      const redirectUri = redirect_uris[0] || 'http://localhost';
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirectUri,
      );
      oAuth2Client.setCredentials(getToken());
      this.auth = oAuth2Client;
    }
  }

  async getListOfMessages(q) {
    const gmail = google.gmail({ version: 'v1', auth: this.auth });
    const response = await gmail.users.messages.list({
      userId: 'me',
      q,
    });

    return response.data.messages || [];
  }

  async getMessage(id) {
    const gmail = google.gmail({ version: 'v1', auth: this.auth });
    const response = await gmail.users.messages.get({
      userId: 'me',
      id,
    });

    assert(response, `message not found in gmail`);

    return response.data;
  }

  async getMessageAttachments(messageId) {
    const gmail = google.gmail({ version: 'v1', auth: this.auth });
    const message = await this.getMessage(messageId);
    assert(message, `message not found in gmail`);
    const attachments = [];
    const parts = message.payload.parts;
    if (parts) {
      for (const part of parts) {
        if (part.filename && part.body && part.body.attachmentId) {
          const attachment = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: message.id,
            id: part.body.attachmentId,
          });
          const attachmentData = attachment.data.data;
          attachments.push({
            filename: part.filename,
            data: Buffer.from(attachmentData, 'base64'),
          });
        }
      }
    }
    return attachments;
  }
};
