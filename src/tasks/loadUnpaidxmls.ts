'use strict';

import { CronJob } from 'cron';
import { get } from '@config';
import {
  loadUnpaidXmlFiles,
  loadUnpaidXmlFromSftp,
} from '../api/service/unpaid/UnpaidXmlService';
import to from 'await-to-js';

const enabled = get('index.tasks.loadUnpaidXml.enabled', false);
const period = get('index.tasks.loadUnpaidXml.period', '0 0 * * * *');

const loadUnpaidXml = async () => {
  // Load from Email / Guisona
  await to(loadUnpaidXmlFiles());

  // Load from SFTP / Sabadell
  await to(loadUnpaidXmlFromSftp());
};

// cron job every day
const job = new CronJob(period, loadUnpaidXml);

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.loadUnpaidXml is disabled');
}
