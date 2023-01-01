import * as GfSimDeliveryService from '@service/intranet/GfSimDeliveryService';

import { Address, merge } from '../../utils/address';
import { AnyModel, intranet } from '@models';
import {
  Includes,
  convertMoozaicUserIdToSystemUserId as convertUserId,
} from '../../utils/utils';

import { DocStatus } from '@api/models/intranet/intranet_docs_status';
import { DocumentView } from '@api/service/documents/types';
import { GfDoc } from '@api/models/intranet/intranet_gf_docs';
import { GfSimDelivery } from '@api/models/intranet/intranet_sim_deliveries';
import { InstallationReport } from '@models/technician/installation_reports';
import { Op } from 'sequelize';
import { Step } from '@service/technician/Step';
import { Task } from '@service/technician/Task';
import { TechnicianTask } from '@models/technician/technician_tasks';
import { User } from '@models/global/global_users';
import assert from 'assert';
import { getCellContractDocs } from '@api/service/intranet/GfContractDataCellService';
import { getDataProtectionDoc } from '@api/service/intranet/GfClientDataProtectionDoc';
import { getInternetContractDoc } from '@api/service/intranet/GfContractDataInternetService';
import { getLatestSepaDoc } from '@api/service/intranet/GfClientSepa';
import { loadStorage } from '@api/service/documents/storages';

const { GfAssist, GfContract, GfContractDataCell } = intranet;

export interface SimDeliveryCtorParams {
  entity: TechnicianTask;
  simDelivery: GfSimDelivery;
  contract: AnyModel;
  client: AnyModel;
  simIcc: string;
}

export class SimDelivery extends Task {
  expectedDurationMinutes: number;
  simIcc?: string;
  #simDelivery: GfSimDelivery;
  address: Address;
  static type = 'incidence/sim_delivery' as const;

  static async loadFromTypeId(typeId: number) {
    const simDelivery = await GfSimDelivery.findByPk(typeId, {
      include: [
        {
          model: GfContract,
          as: 'contract',
          required: true,
          include: [
            Includes.GfFeeGroup,
            {
              model: GfContractDataCell,
              as: 'dataCell',
            },
          ],
        },
        Includes.GfClient,
      ],
    });
    assert(simDelivery, `GfSimDelivery with id:${typeId} not found`);

    const { contract, client, technicianUserId, date } = simDelivery;

    const task = await Task.findOrCreate({
      type: this.type,
      typeId,
      defaults: async () => ({
        technicianUserId: await convertUserId(technicianUserId),
        scheduledDate: date,
        gfClientId: contract.clientId,
        gfContractId: contract.id,
      }),
    });

    return new SimDelivery({
      entity: task,
      simDelivery,
      client,
      contract,
      simIcc: contract.dataCell?.icc,
    });
  }

  static async loadFromTask(task: TechnicianTask) {
    const { typeId } = task;
    const simDelivery = await GfSimDelivery.findByPk(typeId, {
      include: [
        {
          model: GfContract,
          as: 'contract',
          required: true,
          include: [
            Includes.GfFeeGroup,
            {
              model: GfContractDataCell,
              as: 'dataCell',
            },
          ],
        },
        Includes.GfClient,
      ],
    });
    assert(simDelivery, `GfSimDelivery with id:${typeId} not found`);

    const { contract, client } = simDelivery;

    return new SimDelivery({
      entity: task,
      simDelivery,
      client,
      contract,
      simIcc: contract.dataCell?.icc,
    });
  }

  stepsInfo: readonly Step[] = [
    new Step('reaching-to-the-destination'),
    new Step('sign-the-docs', {
      check: () => this.checkDocsToBeSigned(),
    }),
  ];

  constructor({
    entity,
    simDelivery,
    client,
    contract,
    simIcc,
  }: SimDeliveryCtorParams) {
    super({ entity, client, contract });
    this.#simDelivery = simDelivery;
    this.address = merge(simDelivery, this.client);
    this.expectedDurationMinutes = 120;
    this.simIcc = simIcc;
  }

  /**
   * TODO: a transaction is required here but I can't do it because in this version sequelize doesn't supports multi db transactions
   * @see https://github.com/sequelize/sequelize/issues/14698
   * @param user
   */
  async finish(user: User, ...params: any[]) {
    await this.assertAllStepsToBeDone();
    await GfSimDeliveryService.setAsDone(this.#simDelivery.id, user.userId);
    await super.finish(user, ...params);
  }

  async getMustSignDocs(): Promise<DocumentView[]> {
    const { gfClientId, gfContractId } = this.entity;

    const latestSepaDoc = await getLatestSepaDoc(gfClientId);
    const dataPrivacyDoc = await getDataProtectionDoc(gfClientId);
    const dataInternetDoc = await getCellContractDocs(gfContractId!);

    return [latestSepaDoc, dataPrivacyDoc, ...dataInternetDoc].filter(
      (v) => !!v,
    ) as DocumentView[];
  }

  async checkDocsToBeSigned(): Promise<string | true> {
    const docs = await this.getMustSignDocs();
    const ok = docs.every((v) => v.signed);
    if (!ok) return 'Not all documents are signed';
    return true;
  }
}
