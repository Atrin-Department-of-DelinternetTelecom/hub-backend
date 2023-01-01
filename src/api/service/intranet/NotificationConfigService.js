'use strict';

const { GlobalNotificationsConfig } = require('@models').moozaic;

const _ = require('lodash');

/**
 * get settings record based on concept,app and language
 * @param {string} concept to get related concept
 * @param {string} app to get related app
 * @param {string} language to get related language
 * @returns {Object} return selected record base on standard or custom config
 */
exports.getSettings = async (concept, app, language) => {
  let _settings = await GlobalNotificationsConfig.findAll({
    where: {
      concept,
      app,
      lang: language,
      status: 1,
    },
  });

  if (!_settings.length) {
    _settings = [
      await GlobalNotificationsConfig.create({
        concept,
        app,
        lang: language,
        status: 1,
      }),
    ];
  }

  let customSettings = null;
  let standardSettings = null;
  for (const setting of _settings) {
    if (setting.uid === -1) {
      standardSettings = setting;
    } else {
      customSettings = setting;
    }
  }

  return {
    subject:
      _.get(customSettings, 'useCustomTexts', 0) === 1
        ? customSettings?.subject ?? ''
        : standardSettings?.subject ?? '',
    text:
      _.get(customSettings, 'useCustomTexts', 0) === 1
        ? customSettings?.text ?? ''
        : standardSettings?.text ?? '',
    senderId:
      _.get(customSettings, 'useCustomSender', 0) === 1
        ? customSettings?.senderId ?? ''
        : standardSettings?.senderId ?? '',
    imapFolder:
      _.get(customSettings, 'useCustomSender', 0) === 1
        ? customSettings?.imapFolder ?? ''
        : standardSettings?.imapFolder ?? '',
  };
};
