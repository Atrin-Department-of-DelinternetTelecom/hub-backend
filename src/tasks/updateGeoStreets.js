'use strict';

const CronJob = require('cron').CronJob;
const { updateStreets } = require('@service/geo/updateGeoService');
const config = require('@config');

const enabled = config.get('index.tasks.updateGeo.enabled', false);

// cron job at every [Wednesday, Thursday] at every an Hour between [3AM - 7AM]
const job = new CronJob('0 3-7 * * 3,4', updateStreets);
if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.updateGeo is disabled');
}
