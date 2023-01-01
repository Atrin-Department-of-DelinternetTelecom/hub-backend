'use strict';

const CronJob = require('cron').CronJob;
const config = require('@config');
const GfContractDataFixService = require('@service/intranet/GfContractDataFixService');
const moment = require('moment');

const enabled = config.get('index.tasks.executekamailios.enabled', false);
const period = config.get('index.tasks.executekamailios.period', '0 * * * * *');

const onTick = async () => {
  await GfContractDataFixService.executePendingKamailios(
    moment().subtract(1, 'days').format('YYYY-MM-DD'),
  );
};

// every day at 7:00
const job = new CronJob(period, onTick);

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.executekamailios is disabled');
}
