'use strict';

const { Sms } = require('./Sms');
const { Telegram } = require('./Telegram');
const { Message } = require('./Message');
const { ChangeFeeMessage } = require('./ChangeFeeMessage');
const { Email } = require('./Email');

exports.available_notifiers = {
  telegram: Telegram,
  sms: Sms,
  email: Email,
};

exports.buildMessage = function buildMessage(notification) {
  return new Message(notification);
};

exports.buildChangeFeeMessage = function buildChangeFeeMessage(notification) {
  return new ChangeFeeMessage(notification);
};

exports.buildNotifier = function buildNotifier(send_method) {
  const Notifier = exports.available_notifiers[send_method];
  return new Notifier();
};
