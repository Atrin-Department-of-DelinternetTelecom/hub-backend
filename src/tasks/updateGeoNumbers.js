'use strict';

const CronJob = require('cron').CronJob;
const { updateNumbers } = require('@service/geo/updateGeoService');
const config = require('@config');

const enabled = config.get('index.tasks.updateGeo.enabled', false);
// cron job at every [Friday, Saturday, Sunday] at every 30Min between [3AM - 7AM]

const job = new CronJob('*/30 3-7 * * 0,5,6', updateNumbers);
if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.updateGeo is disabled');
}
