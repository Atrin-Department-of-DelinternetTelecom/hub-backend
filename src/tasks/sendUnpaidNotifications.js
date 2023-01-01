'use strict';

const CronJob = require('cron').CronJob;
const UnpaidSendNotificationsService = require('@service/unpaid/UnpaidSendNotificationsService');
const config = require('@config');

const enabled = config.get(
  'index.tasks.sendUnpaidNotifications.enabled',
  false,
);
const period = config.get(
  'index.tasks.sendUnpaidNotifications.period',
  '0 */10 * * * *',
);

const onTick = async () => {
  console.log(`[Running Task][sendAllNotifications]`);
  const notifications =
    await UnpaidSendNotificationsService.getLastNotificationByGivenTime();
  console.log(notifications);
  for (const notification of notifications) {
    try {
      const res = await UnpaidSendNotificationsService.sendNotification(
        notification.id,
        false,
      );
      console.log(res);
    } catch (error) {
      console.error(error);
    }
  }
};

const job = new CronJob(period, onTick);
if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.sendUnpaidNotifications is disabled');
}
