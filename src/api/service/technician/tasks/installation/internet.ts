import { Address, merge } from '../../utils/address';
import { AnyModel, intranet } from '@models';
import {
  Includes,
  convertMoozaicUserIdToSystemUserId as convertUserId,
} from '../../utils/utils';
import {
  getInternetContractDoc,
  putGfContractDataInternetsId,
} from '@service/intranet/GfContractDataInternetService';
import { getTransporter, isEnable, senders } from '@lib/mailer';

import { DocumentView } from '@api/service/documents/types';
import { InstallationReport } from '@models/technician/installation_reports';
import RadiusApiService from '@service/intranet/RadiusApiService';
import { Task } from '../../Task';
import { TechnicianTask } from '@models/technician/technician_tasks';
import { User } from '@models/global/global_users';
import assert from 'assert';
import { checkFirstConnection } from '@api/service/intranet/GfContractInternetService';
import { getDataProtectionDoc } from '@api/service/intranet/GfClientDataProtectionDoc';
import { getLatestSepaDoc } from '@api/service/intranet/GfClientSepa';
import { getPdf } from '@service/documents/DocumentService';
import { loadStorage } from '@api/service/documents/storages';
import to from 'await-to-js';

interface InternetTaskFactory {
  new (param: InternetCtorParams): InternetInstallation;
  type: string;
}

const { GfContractDataInternet, GfContract } = intranet;

export interface InternetCtorParams {
  entity: TechnicianTask;
  dataInternet: AnyModel;
  contract: AnyModel;
  client: AnyModel;
}

export abstract class InternetInstallation extends Task {
  static type: 'installation/fibra' | 'installation/radio';

  dataInternet: AnyModel;
  address: Address;
  expectedDurationMinutes = 120;

  constructor({ entity, dataInternet, client, contract }: InternetCtorParams) {
    super({ entity, client, contract });
    this.dataInternet = dataInternet;
    this.expectedDurationMinutes = dataInternet.installationDuration;
    this.address = merge(dataInternet, this.client);
  }

  async getMustSignDocs(): Promise<DocumentView[]> {
    const { gfClientId, gfContractId } = this.entity;

    const latestSepaDoc = await getLatestSepaDoc(gfClientId);
    const dataPrivacyDoc = await getDataProtectionDoc(gfClientId);
    const dataInternetDoc = await getInternetContractDoc(gfContractId!);

    return [latestSepaDoc, dataPrivacyDoc, dataInternetDoc].filter(
      (v) => !!v,
    ) as DocumentView[];
  }

  async checkDocsToBeSigned(): Promise<string | true> {
    const docs = await this.getMustSignDocs();
    const ok = docs.every((v) => v.signed);
    if (!ok) return 'Not all documents are signed';
    return true;
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

  async checkFirstConnection() {
    if (process.env.TECHNICIAN_IGNORE_CHECK_FIRST_CONNECTION) {
      console.warn(
        'Technician: checking first connection were disabled by env vars',
      );
      return true;
    }

    const { nodeRadiusName } = this.dataInternet;

    if (!nodeRadiusName) {
      return 'Node Radius Name is empty';
    }

    const response = await RadiusApiService.getUserData(nodeRadiusName);

    assert(
      response.success,
      'RadiusApiService.getUserData result is not success',
    );
    if (!response.data.data.connection?.data?.Last_up) {
      return 'Router is not connected yet';
    }

    return true;
  }

  /**
   * TODO: a transaction is required here but I can't do it because in this version sequelize doesn't supports multi db transactions
   * @see https://github.com/sequelize/sequelize/issues/14698
   * @param user
   */
  async finish(user: User, ...params: any[]) {
    await this.assertAllStepsToBeDone();
    (
      await putGfContractDataInternetsId(
        this.dataInternet.id,
        { installationDone: 1 },
        user,
      )
    ).unwrap();

    // this will activate the contract
    await checkFirstConnection({
      sectionId: this.dataInternet.id,
      userId: user.userId,
    });

    await super.finish(user, ...params);

    // @shahriyar send message to tg
  }

  protected async sendEmail({ gfDocIds }: { gfDocIds: number[] }) {
    const toEmail = this.client.emailAddress;
    if (isEnable) return;
    if (!toEmail) return;

    const pdfFiles = await Promise.all(gfDocIds.map((id) => getPdf(id)));

    const [error] = await to(
      getTransporter().sendMail({
        from: senders.default,
        to: toEmail,
        subject: 'Delinternet Documents',
        text: 'Here is your Delinternet documents',
        attachments: pdfFiles.map(({ pdf, fileName }) => ({
          filename: fileName,
          contentDisposition: 'attachment',
          raw: pdf,
        })),
      }),
    );

    if (error) {
      console.error(`[Technician] Error sending email to ${toEmail}`, error);
      return;
    }
  }
}

export async function loadFromTypeId(Factory: InternetTaskFactory, id: number) {
  const dataInternet = await GfContractDataInternet.findByPk(id, {
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: true,
        include: [Includes.GfClient, Includes.GfFeeGroup],
      },
    ],
  });
  assert(dataInternet, `GfContractDataInternet with id:${id} not found`);
  const { client, ...contract } = dataInternet.contract.get({ raw: true });

  const task = await Task.findOrCreate({
    type: Factory.type,
    typeId: id,
    defaults: async () => ({
      technicianUserId: await convertUserId(dataInternet.installatorUserId),
      scheduledDate: dataInternet.instalationDate,
      gfClientId: contract.clientId,
      gfContractId: contract.id,
    }),
  });

  return new Factory({
    entity: task,
    dataInternet,
    contract,
    client,
  });
}

export async function loadFromTask(
  Factory: InternetTaskFactory,
  task: TechnicianTask,
) {
  const { typeId } = task;
  const dataInternet = await GfContractDataInternet.findByPk(typeId, {
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: true,
        include: [Includes.GfClient, Includes.GfFeeGroup],
      },
    ],
  });
  assert(dataInternet, `GfContractDataInternet with id:${typeId} not found`);
  const { client, ...contract } = dataInternet.contract.get({ raw: true });

  return new Factory({
    entity: task,
    dataInternet,
    contract,
    client,
  });
}
