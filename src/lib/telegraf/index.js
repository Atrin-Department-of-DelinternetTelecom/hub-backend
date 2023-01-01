'use strict';

const { Telegraf } = require('telegraf');
const config = require('@config');

const instances = {};

/**
 *
 * @param {string} botToken
 * @returns {Telegraf}
 */
exports.getInstance = function (botToken) {
  if (!instances[botToken]) {
    instances[botToken] = new Telegraf(botToken, config.get('global.telegraf'));
  }
  return instances[botToken];
};
