'use strict';

import { CronJob } from 'cron';
import { get } from '@config';
import AireCdr from '../api/service/intranet/MobilCDR_GfFrontService';
import moment from 'moment';
import { extractCDRs } from '@api/service/intranet/LemonCdrService';
import to from 'await-to-js';

const enabled = get('index.tasks.loadMobileCdr.enabled', false);
const period = get('index.tasks.loadMobileCdr.period', '0 0 * * * *');

const loadMobileCdr = async () => {
  const date = moment().subtract(2, 'days').format('YYYY-MM-DD');
  await to(extractCDRs(date));
  await to(AireCdr.reloadCdr(date));
};

// cron job every day
const job = new CronJob(period, loadMobileCdr);

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.loadMobileCdr is disabled');
}
