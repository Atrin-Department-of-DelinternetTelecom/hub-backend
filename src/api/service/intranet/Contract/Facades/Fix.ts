import {
  ASSIGNABLE,
  SECTION_STATUS,
  SECTION_STATUS_PENDINGS,
} from '@api/constants/statuses';
import { DATA_FIX_TYPE, IVOZ_STATE, SERVICE } from '@api/constants/contracts';
import {
  Facade,
  OperationState,
  ProcessState,
  ProviderState,
  ServiceState,
} from '../contracts';
import OperadorFixFacade, { StatusEnum } from '../../OperadorFixFacade';
import OperadorIvozService, {
  User,
  updateOrCreate,
} from '../../OperadorIvozService';
import {
  fixCompanyUnBlockTask,
  fixInstallationTask,
  fixPortabilityDenied,
  serviceBlockFailed,
  serviceUnblockFailed,
} from '../helpers/events';

import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataFix } from '@api/models/intranet/intranet_gf_contract_data_fix';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { GfIvozFix } from '@api/models/intranet/intranet_gf_ivoz_fix';
import { OperadorLandline } from '@api/models/intranet/intranet_operador_landline';
import { handle as RevisionLandlines } from './../../Actions/RevisionLandlines';
import assert from 'assert';
import config from '@config';
import { findOrFail } from '../../Actions/Caches/GfContractSectionStatusCaches';
import { intranet } from '@api/models';
import to from 'await-to-js';

const { GfContract } = intranet;
export default class Fix implements Facade {
  /**
   * Check the service activation state.
   *
   * @throws {Error}
   */
  public async execute(contractId: number, userId = 0): Promise<ServiceState> {
    const { row, contract } = await findOrFail<GfContractDataFix>(contractId);
    // nothing to do with suspended contracts
    if (contract.isSuspended()) {
      return {
        state: SECTION_STATUS.SUSPENDED,
        pendingState: null,
      };
    }
    assert(
      row,
      `[FacadeFix][execute] missing data fix for contract [${contractId}]`,
    );
    // generate installation events
    if (!contract.isAvailable()) {
      await fixInstallationTask(
        row,
        row.technician_id ? row.technician_id : userId,
      );
    }
    // ignore configure non-particular contracts
    if (!row.isParticular()) {
      return {
        state: SECTION_STATUS.PENDING,
        pendingState: SECTION_STATUS_PENDINGS.INSTALLATION,
      };
    }
    // first ensure number exists on the landline
    const client = await GfClient.findByPk(contract.clientId);
    assert(client, `[FacadeFix][executeIvoz]: Client not found`);

    const landline = await this.getLandline(row, client);
    // we have nothing to do with denied port in numbers
    if (landline.isDenied()) {
      await fixPortabilityDenied(contract.id, userId);
      throw new Error(StatusEnum.DENIED_BY_DONOR);
    }
    // wait for provider to consolidate
    if (!landline.isConsolidated()) {
      return {
        state: SECTION_STATUS.PENDING,
        pendingState: SECTION_STATUS_PENDINGS.WAITFOR_PROVIDER,
      };
    }
    // configure ivoz
    await this.executeIvoz(contractId, client);
    await row.update({ kamailioDone: 1 });

    return {
      state: SECTION_STATUS.DONE,
      pendingState: null,
    };
  }

  async block(contractId: number, userId: number): Promise<ProcessState> {
    const dataFix = await this.getDataFixByContractId(contractId);

    if (dataFix.type === DATA_FIX_TYPE.COMPANY)
      return { state: OperationState.PENDING };

    // block line using Operadors service
    const result = await OperadorIvozService.setRatingPlanGroupId(
      dataFix.number as string,
      config.get('index.operadors.blockRatingPlanGroupId', 13),
    );

    if (!result.success) {
      console.error(`[FacadeFix][block][contractId:${contractId}]`, result);
      await serviceBlockFailed(SERVICE.FIX, contractId, result.reason, userId);

      throw new Error(result.reason);
    }

    return { state: OperationState.DONE };
  }

  async down(contractId: number, userId: number): Promise<ProcessState> {
    const [dataFix, ivozFix] = await Promise.all([
      this.getDataFixByContractId(contractId),
      this.getFixIvozByContractId(contractId),
    ]);
    if (dataFix.number) {
      // destroy service
      const destroy = await OperadorIvozService.delete(dataFix.number);
      // update service state
      await ivozFix.update({
        state: destroy.success ? IVOZ_STATE.PENDING : IVOZ_STATE.ERROR,
        error: destroy.success ? null : destroy.reason,
      });
    }

    return { state: OperationState.DONE };
  }

  async resume(contractId: number, userId: number): Promise<ProcessState> {
    const dataFix = await this.getDataFixByContractId(contractId);

    const contract = await GfContract.findByPk(contractId, {
      include: [{ model: GfFee, as: 'fees' }],
    });
    assert(contract, `Contract ${contractId} not found`);
    const fee = contract.fees.at(-1);
    // nothing to do with business contracts
    if (dataFix.type === DATA_FIX_TYPE.COMPANY) {
      await fixCompanyUnBlockTask(dataFix, userId);
      return { state: OperationState.PENDING };
    }
    // try to unblock service
    const [error, result] = await to(
      OperadorIvozService.setRatingPlanGroupId(
        dataFix.number as string,
        fee.ivozId,
      ),
    );
    if (result?.success) {
      // service unblocked
      return { state: OperationState.DONE };
    }

    console.error(
      `[FacadeFix][resume][contractId:${contractId}]`,
      error ?? result,
    );
    await serviceUnblockFailed(
      SERVICE.FIX,
      contractId,
      error?.message ?? result?.reason ?? '',
      userId,
    );

    throw error ?? new Error(result.reason);
  }

  async getState(contractId: number): Promise<ProviderState> {
    const dataFix = await this.getDataFixByContractId(contractId);
    const [error, response] = await to(
      OperadorIvozService.show(dataFix.number as string),
    );

    return {
      state: response?.success ? SECTION_STATUS.DONE : SECTION_STATUS.ERROR,
      stateText: null,
      reason: error?.message ?? null,
    };
  }

  protected async getLandline(row: GfContractDataFix, client: GfClient) {
    const [landline] = await OperadorLandline.findOrCreate({
      where: { number: row.number },
      defaults: {
        number: row.number,
        gf_contract_id: row.contractId,
        state: ASSIGNABLE.ASSIGNABLE,
        owner: client.fullName(),
        fiscal_id: client.fiscalId,
      },
    });
    const executable = !landline.portability && row.isPortable();

    // request port-in if not ported-in yet!
    // when landline `portability` is NULL means portability not request
    // so if contract is portable we have to request port in.
    if (executable) {
      const result = await OperadorFixFacade.execute(row.contractId);

      assert(
        result.success,
        result?.error ??
          result?.reason ??
          `[Facades][Fix][execute][contractId:${row.contractId}]`,
      );
    }
    // revision landline to get last state
    if (
      !(landline.isConsolidated() || landline.isDenied()) ||
      landline.state !== ASSIGNABLE.ASSIGNED ||
      executable
    ) {
      await RevisionLandlines([landline]);
    }

    return landline;
  }

  protected async executeIvoz(contractId: number, client: GfClient) {
    const ivoz = await this.getFixIvozByContractId(contractId);

    if (!ivoz.password) {
      ivoz.ensureOfPassword();
      await ivoz.save();
    }

    const user: User = {
      ddi: ivoz.extension as number,
      nif: client.fiscalId,
      maxCalls: ivoz.maxCalls,
      maxInboundCalls: ivoz.maxInboundCalls,
      language: ivoz.language as string,
      password: ivoz.password as string,
      ring_time: ivoz.ring_time,
      ratingPlanGroupId: ivoz.ratingGroup,
      voicemail: !!ivoz.voicemail,
    };

    if (ivoz.email) {
      user.email = ivoz.email;
    }

    await updateOrCreate(user);

    const response = await OperadorIvozService.getRegisteredEndpointByDDI(
      String(ivoz.extension),
    );

    await ivoz.update({
      sync: 1,
      state: response.success ? IVOZ_STATE.DONE : IVOZ_STATE.ERROR,
      error: response.success ? null : response.reason ?? 'unknown',
    });

    if (!response.success) {
      throw new Error(
        `[FacadeFix][executeIvoz][contract:${contractId}]: ${
          response.reason ?? 'Ivoz execution error'
        }`,
      );
    }
  }

  protected async getFixIvozByContractId(contractId: number) {
    const ivozFix = await GfIvozFix.findByContractId(contractId);
    assert(ivozFix, `IvozFix for contract ${contractId} not found`);

    return ivozFix;
  }

  protected async getDataFixByContractId(contractId: number) {
    const dataFix = await GfContractDataFix.findByContractId(contractId);
    assert(
      dataFix,
      `[FacadeFix][down]: Contract with id ${contractId} not found`,
    );

    return dataFix;
  }
}
