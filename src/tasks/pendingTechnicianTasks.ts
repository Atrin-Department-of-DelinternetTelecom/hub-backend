import { CronJob } from 'cron';
import config from '@config';
import { tasksWithTechnicianAttachedTask } from '@api/service/stats/StatsTechnicianService';
import moment from 'moment';
import { generateTelegramMessageForPendingTechnicianTasks } from '@api/models/intranet/utils/parseTaskHtml';
import * as telegraf from '@lib/telegraf';
import { intranet as knex } from '@lib/knex';

// cron job every night at 11:30
const period = config.get(
  'index.tasks.pendingTechnicianTasks.period',
  '30 23 * * *',
);
const enabled = config.get('index.tasks.pendingTechnicianTasks.enabled', false);

const job = new CronJob({
  onTick: async () => {
    const today = moment();
    const pendingTasks = await tasksWithTechnicianAttachedTask()
      .clearSelect()
      .select(
        'gf_clients.name as clientName',
        'tasks.typeId',
        'tasks.clientId',
        'tasks.type',
        'tasks.duoDate',
        'tasks.contractId',
        'tasks.isDone',
        'tasks.technicianTaskId',
        'technician.id as userId',
        'tasks.technician_deleted_at',
        knex.raw(
          `IFNULL(tasks.technician_state, 'pending') as technician_state`,
        ),
      )
      .whereBetween('tasks.duoDate', [
        today.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        today.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      ])
      .whereNull('tasks.technician_deleted_at')
      .groupBy('typeId')
      .clone();

    const token = config.get('global.crmTaskBotToken', null);
    const channelId = config.get('global.pendingTasksChannelId', null);

    if (!token || !channelId) {
      console.warn(
        'crm task telegram bot disabled due no global.crmTaskBotToken or global.crmTaskChannelId config',
      );
    } else if (pendingTasks.length > 0) {
      const bot = telegraf.getInstance(token);
      bot.telegram.sendMessage(
        channelId,
        await generateTelegramMessageForPendingTechnicianTasks(pendingTasks),
        {
          parse_mode: 'HTML',
        },
      );
    }
  },
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.pendingTechnicianTasks is disabled');
}
