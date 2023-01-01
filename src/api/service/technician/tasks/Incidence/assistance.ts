import { Address, merge } from '../../utils/address';
import { AnyModel, intranet } from '@models';
import {
  Includes,
  convertGfUserIdToSystemUserId as convertUserId,
} from '../../utils/utils';

import GfAssistService from '@service/intranet/GfAssistService';
import { InstallationReport } from '@models/technician/installation_reports';
import { Step } from '@service/technician/Step';
import { Task } from '@service/technician/Task';
import { TechnicianTask } from '@models/technician/technician_tasks';
import { User } from '@models/global/global_users';
import assert from 'assert';
import { loadStorage } from '@api/service/documents/storages';

const { GfAssist, GfContract } = intranet;

export interface AssistanceCtorParams {
  entity: TechnicianTask;
  assist: AnyModel;
  contract: AnyModel;
  client: AnyModel;
}

export class Assistance extends Task {
  expectedDurationMinutes: number;

  static type = 'incidence/assistance' as const;

  static async loadFromTypeId(typeId: number) {
    const assist = await GfAssist.findByPk(typeId, {
      include: [
        {
          model: GfContract,
          as: 'contract',
          required: true,
          include: [Includes.GfFeeGroup],
        },
        Includes.GfClient,
      ],
    });
    assert(assist, `GfAssist with id:${typeId} not found`);

    const { contract, client, gfUserId, previsionDate } = assist;

    const task = await Task.findOrCreate({
      type: this.type,
      typeId,
      defaults: async () => ({
        technicianUserId: await convertUserId(gfUserId),
        scheduledDate: previsionDate,
        gfClientId: contract.clientId,
        gfContractId: contract.id,
      }),
    });

    return new Assistance({
      entity: task,
      assist,
      client,
      contract,
    });
  }

  static async loadFromTask(task: TechnicianTask) {
    const { typeId } = task;
    const assist = await GfAssist.findByPk(typeId, {
      include: [
        {
          model: GfContract,
          as: 'contract',
          required: true,
          include: [Includes.GfFeeGroup],
        },
        Includes.GfClient,
      ],
    });
    assert(assist, `GfAssist with id:${typeId} not found`);

    const { contract, client } = assist;

    return new Assistance({
      entity: task,
      assist,
      client,
      contract,
    });
  }

  #assist: AnyModel;
  address: Address;

  stepsInfo: readonly Step[] = [
    new Step('reaching-to-the-destination'),
    new Step('upload-images'),
    new Step('generate-the-assistance-report', {
      check: () => this.checkReportToBeGenerated(),
    }),
    new Step('sign-the-assistance-report', {
      check: () => this.checkReportToBeSigned(),
    }),
  ];

  constructor({ entity, assist, client, contract }: AssistanceCtorParams) {
    super({ entity, client, contract });
    this.#assist = assist;
    this.address = merge(assist, this.client);
    this.expectedDurationMinutes = assist.duration;
  }

  /**
   * TODO: a transaction is required here but I can't do it because in this version sequelize doesn't supports multi db transactions
   * @see https://github.com/sequelize/sequelize/issues/14698
   * @param user
   */
  async finish(user: User, ...params: any[]) {
    await this.assertAllStepsToBeDone();

    await GfAssistService.setAsDone(this.#assist.id, user.userId);

    await super.finish(user, ...params);
  }

  protected async checkReportToBeGenerated(): Promise<string | true> {
    const report = await InstallationReport.findOne({
      where: {
        taskId: this.id,
      },
    });

    if (!report) return 'Report not generated yet';
    return true;
  }

  protected async checkReportToBeSigned(): Promise<string | true> {
    const report = await InstallationReport.findOne({
      where: {
        taskId: this.id,
      },
    });

    if (!report) return 'Report not generated yet';

    const doc = await loadStorage(report.docId);
    if (!doc.signed) return 'Installation report not signed yet';

    return true;
  }
}
