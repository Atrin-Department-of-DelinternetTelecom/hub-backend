import { intranet, system } from '@api/models';
import {
  loadCoWorkers,
  loadTechnicians,
} from '../stats/StatsTechnicianService';

import { InternetInstallation } from './tasks/installation/internet';
import { SimDelivery } from './tasks/Incidence/sim_delivery';
import { Task } from './Task';
import { TaskFactories } from './tasks';
import { TechnicianCancelReason } from '@api/models/technician/technician_cancel_reasons';
import { TechnicianCoordinate } from '@api/models/technician/technician_coordinates';
import { TechnicianMaterial } from '@api/models/technician/technician_materials';
import { TechnicianPreset } from '@api/models/technician/technician_presets';
import { TechnicianPresetMaterials } from '@api/models/technician/technician_preset_materials';
import { TechnicianStep } from '@models/technician/technician_steps';
import { TechnicianTask } from '@models/technician/technician_tasks';
import { allTasksSql } from './utils/intranet_tasks_query';
import assert from 'assert';
import { convertSystemUserIdToMoozaicUserId } from './utils/utils';
import { getAllEntities } from '@api/utils/request-handler';
import { getAllRows } from '@utils/knex/table';
import { intranet as knexIntranet } from '@lib/knex';
import { mapAddressObject } from './utils/address';
import moment from 'moment';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import RadiusApiService from '../intranet/RadiusApiService';

const { GfClient, GfContract } = intranet;
const { User } = system;

export async function getUserTasks(
  {
    startDate,
    endDate,
    userId,
  }: {
    userId: number; // id of global_users table
    startDate: Date;
    endDate: Date;
  },
  query: any,
) {
  const moozaicUserId = await convertSystemUserIdToMoozaicUserId(userId);

  const sql = allTasksSql({
    userId: moozaicUserId,
    startDate,
    endDate,
    globalUserId: userId,
  });

  const response = await getAllRows({ sql, query, map: mapAddressObject });
  const tasks = response.unwrap().map(({ duoDate, ...task }) => ({
    ...task,
    duoDate: moment(duoDate),
  }));

  return response.replace(await loadTechnicians(await loadCoWorkers(tasks)));
}

export async function loadTaskByTypeId(
  type: string,
  typeId: number,
  technicianUserId: number,
): Promise<Task> {
  const factory = TaskFactories.find((t) => t.type === type);
  if (!factory) throw new Error(`Task with type:${type} not supported`);

  // soft-delete current task if exist
  await TechnicianTask.destroy({
    where: {
      type,
      typeId,
    },
  });

  return factory.loadFromTypeId(typeId, technicianUserId);
}

export async function loadTaskById(taskId: number): Promise<Task> {
  const task = await TechnicianTask.findByPk(taskId, {
    include: [
      { model: TechnicianCoordinate, as: 'coordinates', required: false },
      {
        model: TechnicianStep,
        as: 'steps',
        include: [
          { model: TechnicianCoordinate, as: 'coordinate', required: false },
        ],
      },
      {
        model: User,
        as: 'technician',
      },
      {
        model: User,
        as: 'cancelledByUser',
        required: false,
      },
      {
        model: TechnicianCancelReason,
        as: 'cancelReason',
      },
    ],
    paranoid: false,
  });
  assert(task, `Task with type:${taskId} not found`);

  if (task.type === 'incidence/assistance') {
    task.coWorkers = await knexIntranet
      .table('intranet.gf_assist_co_workers as co')
      .join('delinternet_hub.global_users as u', 'co.user_id', 'u.id')
      .where('co.gf_assist_id', task.typeId)
      .select('u.id as id', 'first_name', 'last_name', 'email');
  } else {
    task.coWorkers = await knexIntranet
      .table('intranet.installation_co_workers as co')
      .join('delinternet_hub.global_users as u', 'co.user_id', 'u.id')
      .where('co.gf_contract_data_internet_id', task.typeId)
      .select('u.id as id', 'first_name', 'last_name', 'email');
  }

  return loadTask(task);
}

export async function loadTechnicianInProgressTask(
  userId: number,
): Promise<Task | null> {
  const task = await TechnicianTask.findOne({
    where: {
      technicianUserId: userId,
      state: 'in_progress',
    },
    include: [{ model: TechnicianStep, as: 'steps' }],
  });

  if (!task) return null;

  try {
    return await loadTask(task);
  } catch (e) {
    console.error(
      'Error while loading the technician in-progress task. so we will cancel the task to not blocking them',
      e,
    );
    await task.update({
      state: 'cancelled',
      cancelledBy: 'system',
      cancelledAt: new Date(),
      cancelReasonId: 0, // 0 means system
      cancelReasonDescription: e instanceof Error ? e.message : String(e),
    });

    return null;
  }
}

export async function loadTechnicianInProgressTasks() {
  const tasks = await TechnicianTask.findAll({
    where: { state: 'in_progress' },
    include: [{ model: TechnicianStep, as: 'steps' }],
  });
  const taskWithCoWorkers = await loadCoWorkers(tasks);

  const loadedTasks = await Promise.allSettled(taskWithCoWorkers.map(loadTask));

  await Promise.allSettled(
    loadedTasks.map(async (task, index) => {
      // we need to cancel the task to prevent blocking the technician
      if (task.status === 'rejected') {
        console.error(
          'Error while loading the technician in-progress task. so we will cancel the task to not blocking them',
          task.reason,
        );
        await tasks[index].update({
          state: 'cancelled',
          cancelledBy: 'system',
          cancelledAt: new Date(),
          cancelReasonId: 0, // 0 means system
          cancelReasonDescription:
            task.reason instanceof Error
              ? task.reason.message
              : String(task.reason),
        });
      }
    }),
  );

  return loadedTasks
    .filter((task) => task.status === 'fulfilled')
    .map(
      (task, index) =>
        ({
          technicianUserId: tasks[index].technicianUserId,
          ...task.value,
        } as unknown as Task & { technicianUserId: number }),
    );
}

export async function loadTask(task: TechnicianTask): Promise<Task> {
  const factory = TaskFactories.find((t) => t.type === task.type);
  if (!factory) throw new Error(`Task with type:${task.type} not supported`);
  return factory.loadFromTask(task);
}

export async function getTaskMustSignDocs(taskId: number) {
  const task = await loadTaskById(taskId);
  if (task instanceof InternetInstallation || task instanceof SimDelivery) {
    return task.getMustSignDocs();
  }

  return [];
}

export async function getPresetsByTaskType(taskType: string) {
  const presets = await TechnicianPreset.findAll({
    where: {
      forTaskType: taskType,
    },
    include: {
      model: TechnicianPresetMaterials,
      as: 'materials',
      include: [
        {
          model: TechnicianMaterial,
          as: 'material',
          required: true,
        },
      ],
    },
  });

  return presets.map((preset) => {
    const { materials, ...rest } = preset.toJSON() as TechnicianPreset;
    return {
      id: preset.id as number,
      name: preset.name,
      materials: materials!.map((material) => {
        assert(material);
        return {
          materialId: material.materialId,
          title: material.material!.title,
          amount: material.amount,
          unit: material.material!.unit,
        };
      }),
    };
  });
}

export const getTasks = (query: any) => {
  return getAllEntities(query, TechnicianTask, undefined, [
    {
      model: GfClient,
      as: 'client',
    },
    {
      model: User,
      as: 'technician',
    },
    {
      model: GfContract,
      as: 'contract',
    },
    {
      model: TechnicianCancelReason,
      as: 'cancelReason',
    },
  ]);
};

export const putFillCancelledAt = async () => {
  const cancelledTasks = await TechnicianTask.findAll({
    where: { state: 'cancelled' },
    paranoid: false,
  });

  for (const cancelledTask of cancelledTasks) {
    cancelledTask.cancelledAt = cancelledTask.updatedAt;
    await cancelledTask.save();
  }

  return 'cancelled tasks updated';
};
