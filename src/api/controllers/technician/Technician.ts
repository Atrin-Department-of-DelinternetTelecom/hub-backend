import * as Service from '@service/technician';

import { FiberInstallation } from '@service/technician/tasks/installation/internet/fiber';
import { StepValidationError } from '@service/technician/Step';
import { Task } from '@service/technician/Task';
import { TechnicianCancelReason } from '@models/technician/technician_cancel_reasons';
import { TechnicianTask } from '@api/models/technician/technician_tasks';
import { createRoute } from '@utils/controller-factory';
import { errors } from '@api/http/http_errors';
import { getAllEntities } from '@utils/request-handler';
import to from 'await-to-js';

const toView = (task: Task) => ({
  id: task.id,
  type: task.entity.type,
  typeId: task.entity.typeId,
  startedAt: task.entity.startedAt,
  finishedAt: task.entity.finishedAt,
  autoCloseAt: task.entity.autoCloseAt,
  cancelledBy: task.entity.cancelledBy,
  cancelledAt: task.entity.cancelledAt,
  cancelledById: task.entity.cancelledById,
  cancelledByUser: task.entity.cancelledByUser,
  cancelReasonDescription: task.entity.cancelReasonDescription,
  scheduledDate: task.entity.scheduledDate,
  expectedDurationMinutes: task.expectedDurationMinutes,
  state: task.entity.state,
  client: task.client,
  contract: task.contract,
  address: task.address,
  steps: task.entity.getSteps(),
  simIcc: 'simIcc' in task ? task.simIcc : null,
  dataInternet: 'dataInternet' in task ? task.dataInternet : null,
  cancelReason: task.entity.cancelReason,
  technician: task.entity.technician,
  coWorkers: task.entity.coWorkers ?? [],
  coordinates: task.entity.coordinates ?? [],
});

export const getUserTasks = createRoute({
  handler: (req) => {
    const userIdFromParams = req.swagger.params?.userId?.value;
    const userId = userIdFromParams ?? req.user.id;

    return Service.getUserTasks(
      {
        userId,
        startDate: new Date(req.swagger.params.startDate.value),
        endDate: new Date(req.swagger.params.endDate.value),
      },
      req.query,
    );
  },
});

/**
 * getUserTasksOld is totally the same as getUserTasks, but we can't re-use controllers in swagger :(
 */
export const getUserTasksOld = getUserTasks;

export const getAllTasks = createRoute({
  async handler(req) {
    const tasks = await Service.getTasks(req.query);
    return tasks;
  },
});

export const getTask = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const task = await Service.loadTaskById(id);
    return toView(task);
  },
});

export const getInProgressTask = createRoute({
  async handler(req) {
    const userIdFromParams = req.swagger.params?.userId?.value;
    const userId = userIdFromParams ?? req.user.id;
    const task = await Service.loadTechnicianInProgressTask(userId);
    if (!task) throw new errors.NotFound(`You don't have any in-progress task`);
    return toView(task);
  },
});

export const getInProgressTasks = createRoute({
  async handler() {
    const tasks = await Service.loadTechnicianInProgressTasks();

    return tasks.map((task) => ({
      technicianUserId: task.technicianUserId,
      ...toView(task),
    }));
  },
});
/**
 * getUserTasksOld is totally the same as getUserTasks, but we can't re-use controllers in swagger :(
 */
export const getInProgressTaskOld = getInProgressTask;

export const startTaskByTypeId = createRoute({
  async handler(req) {
    const { coordinates } = req.body;
    const type = req.swagger.params.type.value;
    const typeId = req.swagger.params.typeId.value;
    const userId = req.user.userId;
    const task = await Service.loadTaskByTypeId(type, typeId, userId);

    await task.start(coordinates);

    return toView(task);
  },
});

/**
 * @deprecated finish task is not needed anymore. task can be finished by set the last step to 'done'
 */
export const finishTask = createRoute({
  async handler(req) {
    const { coordinates } = req.body;
    const id = req.swagger.params.id.value;
    const task = await Service.loadTaskById(id);
    if (task.entity.state === 'in_progress') {
      await task.finish(req.user, coordinates);
    }

    return toView(task);
  },
});

export const cancelTask = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const { coordinates } = req.body;
    const { reasonId, description, by } = req.body;

    const task = await Service.loadTaskById(id);
    await task.cancel(
      {
        by: by ?? 'technician',
        reasonId,
        description,
        coordinates,
      },
      { intranetUserId: req.user.userId, globalUserId: req.user.id },
    );

    return toView(task);
  },
});

export const setTaskStepAsDone = createRoute({
  async handler(req) {
    const { coordinates, media } = req.body;
    const step = req.swagger.params.step.value;
    const id = req.swagger.params.id.value;
    const task = await Service.loadTaskById(id);
    const [error] = await to(
      task.setStepAsDone(step, req.user, coordinates, media),
    );

    if (error) {
      if (error instanceof StepValidationError) {
        throw new errors.BadRequest(error.message);
      }
      throw error;
    }

    return toView(task);
  },
});

export const setTaskInProgressStep = createRoute({
  async handler(req) {
    const step = req.body.step;
    const id = req.swagger.params.id.value;
    const task = await Service.loadTaskById(id);
    await task.setInProgressStep(step);
    return toView(task);
  },
});

export const getTaskCancelReasons = createRoute({
  async handler({ query }) {
    return getAllEntities(query, TechnicianCancelReason);
  },
});

export const createTaskCancelReasons = createRoute({
  async handler({ body: { label, category, commentRequired } }) {
    return TechnicianCancelReason.create({
      label,
      commentRequired,
      category,
      name: '',
    });
  },
});

export const getTaskCancelReason = createRoute({
  async handler({ swagger: { params } }) {
    const reason = await TechnicianCancelReason.findByPk(params.id.value, {
      attributes: ['id', 'name', 'label', 'category', 'commentRequired'],
    });

    if (!reason) {
      throw new errors.NotFound();
    }

    return reason.get({ plain: true });
  },
});

export const updateTaskCancelReason = createRoute({
  async handler({
    body: { label, category, commentRequired },
    swagger: { params },
  }) {
    const id = params.id.value;
    const reason = await TechnicianCancelReason.findByPk(id, { raw: true });

    if (!reason) {
      throw new errors.NotFound();
    }

    await TechnicianCancelReason.update(
      { label, category, commentRequired },
      { where: { id } },
    );
    return TechnicianCancelReason.findByPk(id);
  },
});

export const deleteTaskCancelReason = createRoute({
  async handler({ swagger: { params } }) {
    await TechnicianCancelReason.destroy({ where: { id: params.id.value } });
  },
});

export const saveCpeSn = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const { cpeSn } = req.body;

    const task = await Service.loadTaskById(id);

    if (!(task instanceof FiberInstallation)) {
      throw new errors.BadRequest(
        'only fiber installation task can be used to be connected via this method',
      );
    }

    return task.saveCpeSn(cpeSn, req.user);
  },
});

export const cpeStatus = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const task = await Service.loadTaskById(id);

    if (!(task instanceof FiberInstallation)) {
      throw new errors.BadRequest(
        'only fiber installation task can be used to be connected via this method',
      );
    }

    const state = await task.checkFirstConnection();

    if (state === true) {
      return {
        connected: true,
      };
    }

    return {
      connected: false,
      reason: state,
    };
  },
});

export const cpeCoa = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const task = await Service.loadTaskById(id);

    if (!(task instanceof FiberInstallation)) {
      throw new errors.BadRequest(
        'only fiber installation task can be used to be connected via this method',
      );
    }

    return task.coa();
  },
});

export const getTaskPresets = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const task = await TechnicianTask.findByPk(id);
    if (!task) throw new errors.NotFound(`Task with id:${id} not found`);

    return Service.getPresetsByTaskType(task.type);
  },
});

export const getMustSignDocs = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    return Service.getTaskMustSignDocs(id);
  },
});

export const putFillCancelledAt = createRoute({
  async handler(req) {
    return Service.putFillCancelledAt();
  },
});
