import { AnyModel } from '@api/models';
import { GfSimDelivery } from '@api/models/intranet/intranet_sim_deliveries';
import { TechnicianStep } from '@api/models/technician/technician_steps';
import { TechnicianTask } from '@api/models/technician/technician_tasks';
import { loadTask } from './Technician';

const include = [{ model: TechnicianStep, as: 'steps' }];

export const onDataInternetDateChanged = async (
  dataInternet: AnyModel,
  {
    globalUserId,
    intranetUserId,
  }: { globalUserId: number; intranetUserId: number },
) => {
  // we are going to cancel all pending and in-progress tasks
  const tasks = await TechnicianTask.findAll({
    where: {
      type: ['installation/fibra', 'installation/radio'],
      typeId: dataInternet.id,
      state: ['pending', 'cancelled'],
    },
    include,
  });

  for (const task of tasks) {
    const manager = await loadTask(task);
    await manager.cancel(
      {
        by: 're_schedule',
      },
      {
        globalUserId,
        intranetUserId,
      },
    );
  }
};

export const onAssistanceDateChanged = async (
  assist: AnyModel,
  {
    globalUserId,
    intranetUserId,
  }: { globalUserId: number; intranetUserId: number },
) => {
  // we are going to cancel all pending and in-progress tasks
  const tasks = await TechnicianTask.findAll({
    where: {
      type: 'incidence/assistance',
      typeId: assist.id,
      state: ['pending', 'cancelled'],
    },
    include,
  });

  for (const task of tasks) {
    const manager = await loadTask(task);
    await manager.cancel(
      {
        by: 're_schedule',
      },
      {
        globalUserId,
        intranetUserId,
      },
    );
  }
};

export const onSimDeliveryTaskDateChanged = async (
  simDelivery: GfSimDelivery,
  {
    globalUserId,
    intranetUserId,
  }: {
    globalUserId: number;
    intranetUserId: number;
  },
) => {
  // we are going to cancel all pending and in-progress tasks
  const tasks = await TechnicianTask.findAll({
    where: {
      type: 'incidence/sim_delivery',
      typeId: simDelivery.id,
      state: ['pending', 'cancelled'],
    },
    include,
  });

  for (const task of tasks) {
    const manager = await loadTask(task);
    await manager.cancel(
      {
        by: 're_schedule',
      },
      {
        globalUserId,
        intranetUserId,
      },
    );
  }
};
