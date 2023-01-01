import { errors } from '@api/http/http_errors';
import { coa, updateFromContract } from '@api/service/intranet/RadiusService';
import { User } from '@models/global/global_users';
import { TechnicianTask } from '@models/technician/technician_tasks';
import { putGfContractDataInternetsId } from '@service/intranet/GfContractDataInternetService';
import { Step } from '@service/technician/Step';
import assert from 'assert';
import {
  InternetInstallation,
  loadFromTask,
  loadFromTypeId,
} from '../internet';

export class FiberInstallation extends InternetInstallation {
  static type = 'installation/fibra' as const;
  static loadFromTask = (task: TechnicianTask) =>
    loadFromTask(FiberInstallation, task);

  static loadFromTypeId = (id: number) => loadFromTypeId(FiberInstallation, id);

  stepsInfo: readonly Step[] = [
    new Step('reaching-to-the-destination'),
    new Step('upload-client-documents', {
      check: () => this.checkDocsToBeSigned(),
    }),
    new Step('upload-pre-installation-images'),
    new Step('upload-post-installation-images'),
    new Step('generate-the-installation-report', {
      check: () => this.checkReportToBeGenerated(),
    }),
    new Step('sign-the-installation-report', {
      check: () => this.checkReportToBeSigned(),
    }),
    new Step('config-router-ssid-and-password', { optional: true }),
    new Step('set-router-cpe-sn', {
      check: () => this.checkCpeSn(),
    }),
    new Step('connect-the-router', {
      check: () => this.checkFirstConnection(),
    }),
  ];

  async saveCpeSn(cpeSn: string, user: User) {
    const { contract, dataInternet } = this;
    assert(contract);

    (
      await putGfContractDataInternetsId(
        dataInternet.id,
        {
          cpeSn,
        },
        user,
      )
    ).unwrap();

    await updateFromContract(contract.id, {
      skipCoa: true,
    });
  }

  async checkCpeSn() {
    const { dataInternet } = this;
    if (dataInternet.cpeSn) return true;
    return 'Router serial number should be set';
  }

  async coa() {
    const { contract } = this;
    assert(contract);

    if (process.env.TECHNICIAN_IGNORE_CHECK_FIRST_CONNECTION) {
      console.warn(
        'Technician: checking first connection were disabled by env vars',
      );
      return 'Router connected to the network. (Ignored)';
    }

    const connectionState = await this.checkFirstConnection();
    if (connectionState !== true) {
      throw new errors.BadRequest(connectionState);
    }

    const coaResult = await coa(contract.id);
    if (!coaResult.success) {
      throw new errors.InternalServerError(coaResult.reason);
    }
  }
}
