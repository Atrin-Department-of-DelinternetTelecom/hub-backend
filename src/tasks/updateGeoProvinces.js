'use strict';

const CronJob = require('cron').CronJob;
const { updateProvinces } = require('@service/geo/updateGeoService');
const config = require('@config');

const enabled = config.get('index.tasks.updateGeo.enabled', false);

// cron job every 15th of month on 4AM
const job = new CronJob('0 4 15 * *', updateProvinces);
if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.updateGeo is disabled');
}
