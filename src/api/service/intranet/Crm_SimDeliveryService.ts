import { AnyModel, intranet } from '@models';
import { onAfterUpdateEvent, tglExecute } from './CrmTaskService';
import { createFullEvent } from './CrmTaskHelperService';
import moment from 'moment';
const { CrTask, CrmUser, CrTaskUserXref } = intranet;
import { GfSimDelivery } from '@api/models/intranet/intranet_sim_deliveries';
import assert from 'assert';
import { Op } from 'sequelize';

export const syncTask = async (
  simDelivery: GfSimDelivery,
  userId: number,
  comeFrom = '',
) => {
  //get related tasks(if exists)
  const { scheduledEvent, needToScheduleEvent } = await getSimRelatedEvents(
    simDelivery.id,
  );

  // specify the state and main event based on symDelivery field
  let state: 'done' | 'needToSchedulePending' | 'scheduledPending' | null =
    null;
  let mainEvent: 'needToSchedule' | 'scheduled' = 'needToSchedule';

  // everything is done and all tasks must be finished
  if (simDelivery.closed) {
    state = 'done';
    mainEvent = 'scheduled';
  }

  //need to schedule for deliver the sim
  if (!state && (!simDelivery.date || !simDelivery.technicianUserId)) {
    state = 'needToSchedulePending';
    mainEvent = 'needToSchedule';
  }

  //scheduled for sim delivery
  if (!state) {
    state = 'scheduledPending';
    mainEvent = 'scheduled';
  }

  if (!state) return { success: false, error: 'no state found' };

  switch (state) {
    case 'needToSchedulePending':
      !needToScheduleEvent
        ? await createSimRelatedEvent('needToSchedule', simDelivery, userId)
        : tglExecute(
            needToScheduleEvent.id,
            null,
            null,
            0,
            false,
            userId,
            false,
            comeFrom,
          );

      break;
    case 'scheduledPending':
      if (needToScheduleEvent && needToScheduleEvent.executed !== '1')
        await tglExecute(
          needToScheduleEvent.id,
          null,
          null,
          1,
          false,
          userId,
          false,
          comeFrom,
        );

      if (!scheduledEvent)
        await createSimRelatedEvent('scheduled', simDelivery, userId);

      break;

    case 'done':
      if (needToScheduleEvent && needToScheduleEvent.executed !== '1')
        await tglExecute(
          needToScheduleEvent.id,
          null,
          null,
          1,
          false,
          userId,
          false,
          comeFrom,
        );

      if (scheduledEvent && scheduledEvent.executed !== '1')
        await tglExecute(
          scheduledEvent.id,
          null,
          null,
          1,
          false,
          userId,
          false,
          comeFrom,
        );
      break;
  }

  await syncSymRelatedEventsWithGfSimDelivery(
    simDelivery,
    {
      scheduledEvent,
      needToScheduleEvent,
    },
    userId,
    comeFrom,
  );

  return { success: true };
};

const getSimRelatedEvents = async (simDeliveryId: number) => {
  const scheduledKey = `scheduled_simDelivery_${simDeliveryId}_CELL`;
  const needToScheduledKey = `needToScheduled_simDelivery_${simDeliveryId}_CELL`;
  const tasks = await CrTask.findAll({
    where: {
      refererTrace: [scheduledKey, needToScheduledKey],
    },
  });

  const needToScheduleEvent =
    tasks[0]?.refererTrace === needToScheduledKey ? tasks[0] : tasks[1];

  const scheduledEvent =
    tasks[0]?.refererTrace === scheduledKey ? tasks[0] : tasks[1];

  return { scheduledEvent, needToScheduleEvent };
};

const createSimRelatedEvent = async (
  type: 'scheduled' | 'needToSchedule',
  simDelivery: GfSimDelivery,
  userId: number,
) => {
  return createFullEvent(
    `${type}_simDelivery`,
    simDelivery.contractId,
    {
      subject:
        type === 'scheduled'
          ? 'scheduled deliver simcard'
          : 'need to schedule deliver simcard',
      metadata: {
        action:
          type === 'scheduled'
            ? 'simDeliveryScheduledDone'
            : 'simDeliveryNeedToScheduledDone',
        contractId: simDelivery.contractId,
        simDelivery: true,
        simDeliveryId: simDelivery.id,
      },
      previsionDate: moment(simDelivery.date).format('YYYY-MM-DD HH:mm:ss'),
      onetime: true,
      subscribers: type === 'scheduled' ? [simDelivery.technicianUserId] : [],
      duration: 10,
    },
    'CELL',
    `${simDelivery.id}`,
    userId,
  );
};

const syncSymRelatedEventsWithGfSimDelivery = async (
  simDelivery: GfSimDelivery,
  relatedEvents: { scheduledEvent: AnyModel; needToScheduleEvent: AnyModel },
  userId: number,
  comeFrom = '',
) => {
  if (relatedEvents.scheduledEvent) {
    const crmUser = await CrmUser.findOne({
      where: { userId: simDelivery.technicianUserId },
    });
    assert(crmUser, 'technician not found');

    const subscribers = await CrTaskUserXref.findAll({
      where: {
        taskId: relatedEvents.scheduledEvent.id,
      },
      include: { model: CrmUser, as: 'user' },
    });

    const exist = subscribers.find(
      (subscriber) => subscriber.user.userId === crmUser.userId,
    );

    if (!exist) {
      const creator = subscribers.find(
        (subscriber) => subscriber.user.userId === simDelivery.userId,
      );
      const where: Record<string, string | object> = {
        taskId: relatedEvents.scheduledEvent.id,
      };
      if (creator?.user?.id) {
        where.userId = { [Op.not]: creator.user.id };
      }

      await CrTaskUserXref.update({ status: 0 }, { where });
      await CrTaskUserXref.create({
        userId: crmUser.id,
        taskId: relatedEvents.scheduledEvent.id,
      });
    }
    relatedEvents.scheduledEvent.date = simDelivery.date;
    await relatedEvents.scheduledEvent.save();
    onAfterUpdateEvent(
      relatedEvents.scheduledEvent,
      {},
      userId,
      false,
      false,
      comeFrom,
    );
    return;
  }

  if (relatedEvents.needToScheduleEvent) {
    relatedEvents.needToScheduleEvent.date = simDelivery.date;
    await relatedEvents.needToScheduleEvent.save();
    onAfterUpdateEvent(
      relatedEvents.needToScheduleEvent,
      {},
      userId,
      false,
      false,
      comeFrom,
    );
    return;
  }
};

export const onEventUpdated = async (task: AnyModel, comeFrom = '') => {
  if (comeFrom === 'simDelivery') return { success: true };
  const metadata = JSON.parse(task.refererMetadata ?? '{}');
  const simDelivery = await GfSimDelivery.findByPk(metadata.simDeliveryId);
  assert(
    simDelivery,
    `simDelivery with id ${metadata.simDeliveryId} not found`,
  );

  if (metadata.action === 'simDeliveryScheduledDone') {
    simDelivery.date = task.previsionDate;
    await simDelivery.save();
  }

  return {
    success: true,
  };
};

export const onEventExecuted = async (task: AnyModel, comeFrom = '') => {
  if (comeFrom === 'simDelivery') return { success: true };
  const metadata = JSON.parse(
    task.refererMetadata ? task.refererMetadata : '{}',
  );

  const simDelivery = await GfSimDelivery.findByPk(metadata.simDeliveryId);
  assert(
    simDelivery,
    `simDelivery with id ${metadata.simDeliveryId} not found`,
  );

  switch (metadata.action) {
    case 'simDeliveryNeedToScheduledDone':
      if (
        !moment(simDelivery.date).isValid() ||
        !(simDelivery.technicianUserId > 0)
      ) {
        return {
          success: false,
          reason: `You must provide a date and user on sim delivery record`,
        };
      }
      break;
    case 'simDeliveryScheduledDone':
      simDelivery.closed = true;
      await simDelivery.save();
  }

  return {
    success: true,
  };
};

export const onEventDeExecuted = async (task: AnyModel, comeFrom = '') => {
  if (comeFrom === 'simDelivery') return { success: true };
  const metadata = JSON.parse(
    task.refererMetadata ? task.refererMetadata : '{}',
  );
  const simDelivery = await GfSimDelivery.findByPk(metadata.assistanceId);
  assert(
    simDelivery,
    `simDelivery with id ${metadata.simDeliveryId} not found`,
  );

  switch (metadata.action) {
    case 'simDeliveryNeedToScheduledDone':
      if (
        !moment(simDelivery.date).isValid() ||
        !(simDelivery.technicianUserId > 0)
      ) {
        return {
          success: true,
        };
      }
      break;
    case 'simDeliveryScheduledDone':
      simDelivery.closed = false;
      await simDelivery.save();
      return {
        success: true,
      };
  }
};
