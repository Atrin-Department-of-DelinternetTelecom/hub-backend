import { Address, merge } from '../../utils/address';
import { AnyModel, intranet } from '@models';

import { Includes } from '../../utils/utils';
import { Step } from '@service/technician/Step';
import { Task } from '@service/technician/Task';
import { TechnicianTask } from '@models/technician/technician_tasks';
import { User } from '@models/global/global_users';
import assert from 'assert';

const { CrmTask } = intranet;

export interface ClientTaskCtorParams {
  entity: TechnicianTask;
  crmTask: AnyModel;
  client: AnyModel;
}

export class ClientTask extends Task {
  expectedDurationMinutes = 120;

  static type = 'client-task' as const;

  static async loadFromTypeId(typeId: number, technicianUserId: number) {
    const crmTask = await CrmTask.findByPk(typeId, {
      include: [Includes.GfClient],
    });
    assert(crmTask, `CrmTask with id:${typeId} not found`);

    const { client, previsionDate } = crmTask;

    const task = await Task.findOrCreate({
      type: this.type,
      typeId,
      defaults: async () => ({
        technicianUserId,
        scheduledDate: previsionDate,
        gfClientId: client.id,
        gfContractId: null,
      }),
    });

    return new ClientTask({
      entity: task,
      crmTask,
      client,
    });
  }

  static async loadFromTask(task: TechnicianTask) {
    const { typeId } = task;
    const crmTask = await CrmTask.findByPk(typeId, {
      include: [Includes.GfClient],
    });
    assert(crmTask, `CrmTask with id:${typeId} not found`);

    const { client } = crmTask;

    return new ClientTask({
      entity: task,
      crmTask,
      client,
    });
  }

  #crmTask: AnyModel;
  address: Address;

  stepsInfo: readonly Step[] = [];

  get id() {
    return this.entity.id;
  }

  constructor({ entity, crmTask, client }: ClientTaskCtorParams) {
    super({ entity, client });
    this.#crmTask = crmTask;
    this.address = merge(crmTask, this.client);
  }

  async finish(user: User, ...params: any[]) {
    await super.finish(user, ...params);
    await this.#crmTask.update({ executed: 1, executedDate: new Date() });
  }
}
