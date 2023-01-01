'use strict';

module.exports = {
  disableTasks: process.env.DISABLE_TASKS === 'true',
  telegraf: {
    handlerTimeout: 90_000,
    telegram: {
      apiRoot: 'https://api.telegram.org',
    },
  },
  closetBotToken: process.env.CLOSET_BOT_TOKEN,
  crmTaskBotToken: process.env.CRM_TASK_BOT_TOKEN,
  crmTaskChannelId: process.env.CRM_TASK_CHANNEL_ID,
  technicianChannelId: process.env.TECHNICIAN_CHANNEL_ID,
  technicianChannelThreadId: process.env.TECHNICIAN_CHANNEL_THREAD_ID,
  pendingTasksChannelId: process.env.PENDING_TASKS_CHANNEL_ID,
  hooks: {
    enable: process.env.ENABLE_HOOKS === 'true',
  },
  actions: {
    disable: process.env.DISABLE_ACTIONS === 'true',
  },
  backup: {
    secret: process.env.BACKUP_SECRET ?? '',
  },
  userActivityLogger: {
    enable: process.env.ENABLE_USER_ACTIVITY_LOGGER === 'true' ?? false,
    TTL: 10 * 60 * 1000, // ten mins
  },
  defaultTaxPercentage: 21,
};
