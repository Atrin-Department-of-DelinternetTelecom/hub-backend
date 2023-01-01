// @ts-check
'use strict';

const {
  system: { UserActivityLog },
} = require('@models');
const config = require('@config');
const debug = require('debug')('global:user-activity-logger');

const TTL = config.get('global.userActivityLogger.TTL');
const enable = config.get('global.userActivityLogger.enable');

/** @type {Map<number, number>} */
const userLastLogTime = new Map();

/**
 * @param {number} user_id
 */
async function store(user_id) {
  try {
    await UserActivityLog.create({
      user_id,
    });
    debug('User activity logged', user_id);
  } catch (e) {
    console.error(e);
  }
}

/**
 * @param {number} user_id
 */
function log(user_id) {
  if (!enable) return;
  if (!user_id) return;
  const lastLogTime = userLastLogTime.get(user_id);
  const now = Date.now();

  // if already logged at last x mins
  if (lastLogTime && now - lastLogTime < TTL) return;
  userLastLogTime.set(user_id, now);
  store(user_id);
}

module.exports = {
  log,
};
