import {
  AIRE_STATUS,
  SECTION_STATUS,
  SECTION_STATUS_PENDINGS,
  SUSPENDING_STATE,
} from '@api/constants/statuses';
import { AireLine, AireRequestLine } from '@api/service/intranet/AireService';
import {
  CELL_PROVIDER_CODE,
  CELL_SIM_TYPE,
  SERVICE,
} from '@api/constants/contracts';
import {
  CellProvider,
  CellProviderState,
  ContractCondition,
  OperationState,
  ProcessState,
  ServiceState,
} from '../../contracts';
import { ResumeUnpaidErrors, STATE } from '@delinternet/sdk-aire';
import {
  cancelBlockingTask,
  ignoreBlockingTask,
  ignoreUnblockingTask,
  serviceBlockingTask,
  serviceUnblockingTask,
} from '../../helpers/events';

import { Aire } from '@lib/sdk';
import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { SuspendingAction } from '@api/models/global/global_suspending_action';
import assert from 'assert';
import { client } from '@config';
import { getAlive } from '@api/service/intranet/GfContractsUnpaidService';
import { getSolicitud } from '@api/service/intranet/AireSolicitudeService';
import { intranet } from '@api/models';
import to from 'await-to-js';

const {
  GfSubscriberType,
  GfCellProviderFeeBonus,
  GfContractDataCellInitialBonusXref,
} = intranet;

export default class AireProvider implements CellProvider {
  async execute({
    dataCell,
    cellFee,
    condition,
  }: ContractCondition): Promise<ServiceState> {
    if (!dataCell.providerRequestCode && !condition.cellExcludeFromAire) {
      const method = dataCell.portability
        ? Aire.setAltaLineaPortabilidad.bind(Aire)
        : Aire.setAltaLineaNueva.bind(Aire);

      const aireResult = await method(
        await this.requestPayload(dataCell, cellFee, !!dataCell.portability),
      );

      await dataCell.update({
        providerRequestCode: aireResult.replace(/##/g, ''),
      });
    }

    return {
      state: SECTION_STATUS.PENDING,
      pendingState: SECTION_STATUS_PENDINGS.WAITFOR_PROVIDER,
    };
  }

  async requestPayload(
    dataCell: GfContractDataCell,
    cellFee: GfCellProviderFee,
    portability = false,
  ) {
    const client = await GfClient.findByContractId(dataCell.contractId);
    assert(client, `Client not found for contract[${dataCell.contractId}]`);
    const subscriberType = await GfSubscriberType.findByPk(
      client.subscriberTypeId!,
    );
    const { bonusV, bonusD } = await this.initialBonuses(dataCell.id);

    const payload: Record<string, unknown> = {
      tarifa: cellFee.providerFeeId,
      subscriberType: subscriberType?.aireNetworksCode,
      nif: client.fiscalId,
      telefono: dataCell.number, // getPoolMsisdn
      codigo_reserva: dataCell.providerReserveCode, // getPoolMsisdn
      responseNsolicitud: 'S',
    };

    if (dataCell.simType === CELL_SIM_TYPE.ESIM) {
      payload.tipo_sim = 'esim';
      payload.email_esim = dataCell.email;
    } else {
      payload.icc = dataCell.icc;
      payload.digito_control = dataCell.iccControlDigit;
    }

    if (portability) {
      payload.modalidad_actual = dataCell.actualModality;
      payload.icc_origen = dataCell.origenIcc;
      payload.dc_origen = dataCell.origenControlDigit;
    }

    if (bonusV.length > 0) {
      payload.bonos_v = {
        attributes: { type: 'SOAP-ENC:Array' },
        item: bonusV,
      };
    }

    if (bonusD.length > 0) {
      payload.bonos_d = {
        attributes: { type: 'SOAP-ENC:Array' },
        item: bonusD,
      };
    }

    return payload;
  }

  async getState({ dataCell }: ContractCondition): Promise<CellProviderState> {
    assert(dataCell.providerRequestCode, 'Invalid providerRequestCode');
    const solicitud = await getSolicitud(dataCell.providerRequestCode);

    return {
      state:
        (solicitud?.estado as string) === AIRE_STATUS.ACTIVATE
          ? SECTION_STATUS.DONE
          : SECTION_STATUS.PENDING,
      stateText: solicitud?.estado ?? null,
      provider: CELL_PROVIDER_CODE.AIRE,
      reason: null,
    };
  }

  async initialBonuses(dataCellId: number) {
    const bonusD = [];
    const bonusV = [];

    const bonuses = await GfCellProviderFeeBonus.findAll({
      include: [
        {
          model: GfContractDataCellInitialBonusXref,
          as: 'xrefs',
          required: true,
          where: { dataCellId },
        },
      ],
    });

    for (const item in bonuses) {
      switch (bonuses[item].bonusType) {
        case 'DATOS':
          bonusD.push(bonuses[item].providerBonusId);
          break;
        case 'VOZ':
        case 'ONNET':
          bonusV.push(bonuses[item].providerBonusId);
          break;
        default:
          // statements_def
          break;
      }
    }

    return {
      bonusV: bonusV,
      bonusD: bonusD,
    };
  }
  async down({ dataCell, contract }: ContractCondition): Promise<ProcessState> {
    // line not found on the AIRE
    if (!dataCell.providerRequestCode) {
      return { state: OperationState.DONE };
    }

    const requestLine = await AireRequestLine.findOne({
      codigo: dataCell.providerRequestCode,
    });
    const message = `[AireProvider][down] AireRequestLine with codigo:${dataCell.providerRequestCode} not found`;

    if (!contract.isAvailable() && !requestLine) {
      console.warn(message);
      return { state: OperationState.DONE };
    }
    // An AIRE request is necessary to terminate the line
    assert(requestLine, message);
    // do down service
    if (this.isAireProcessingState(requestLine.estado)) {
      await Aire.cancelRequestLine({ codigo: dataCell.providerRequestCode });
    }

    const suspending = await SuspendingAction.findOne({
      where: { gf_contract_id: contract.id, state: SUSPENDING_STATE.SIGNING },
    });
    // ensure line is terminated
    assert(
      requestLine.estado === STATE.FINISHED || suspending,
      'You have to use suspending process.',
    );

    return { state: OperationState.DONE };
  }

  protected isAireProcessingState(state: string) {
    return [
      'LINEA NO PROCESADA',
      'PROCESANDO',
      'BLOQUEADA',
      'BLOQUEADA PARCIALMENTE',
    ].includes(state);
  }

  async block(
    { dataCell, contract, condition, client }: ContractCondition,
    userId = 0,
  ): Promise<ProcessState> {
    if (condition.cellExcludeFromAire) {
      await this.noAireBlock(contract.id, userId);

      return { state: OperationState.DONE };
    }

    assert(
      dataCell.number,
      `[AireProvider][block] Missing cell number [${contract.id}]`,
    );
    // first we check the current unpaid status from aire
    const line = await AireLine.findOne({
      telefono: dataCell.number,
      fiscalId: client.fiscalId,
    });

    assert(
      line,
      `[AireProvider][block] AireLine with telefono:${dataCell.number} not found`,
    );

    const cutRequestState = AireLine.cutRequestState(line);
    // if already cancelled or requested to cancel we do nothing
    if (cutRequestState === 'SOL' || cutRequestState === 'COR') {
      console.warn(
        '[AireProvider][block] already cancelled or requested to cancel',
      );
    } else {
      await Aire.unpaidCutRequest({ telefono: dataCell.number });
    }

    return { state: OperationState.DONE };
  }

  async resume(
    { dataCell: { number }, condition, contract, client }: ContractCondition,
    userId: number,
  ): Promise<ProcessState> {
    if (condition.cellExcludeFromAire) {
      console.debug(
        `[AireProvider][resume] contract ${contract.id} is excluded from aire`,
      );
      await this.noAireResume(contract.id, userId);
      return { state: OperationState.DONE };
    }
    // resume the service
    assert(
      number,
      `[AireProvider][resume] missing cell number for contract [${contract.id}]`,
    );
    // first we check the current unpaid status from aire
    const lines = await AireLine.findAll({
      telefono: number,
      fiscalId: client.fiscalId,
    });
    const activeLine = lines.find((line) => line.activo === 'SI');

    assert(
      lines.length,
      `[AireProvider][resume] AireLine with telefono:${number} not found`,
    );
    // no need to resume the suspended line
    if (!activeLine) {
      console.debug(
        `[AireProvider][resume] line with telefono:${number} is already suspended`,
        lines,
      );
      return { state: OperationState.DONE };
    }
    // try to resume the line
    const cutRequestState = AireLine.cutRequestState(activeLine);

    if (!cutRequestState) {
      // in this case, we don't know exactly what to do. We will try to cancel the cut request and if it fails,
      // we will try to resume the line
      const [cancelCutError] = await to(
        Aire.cancelCutRequest({ telefono: number }),
      );

      if (!cancelCutError) {
        console.debug('[AireProvider][resume] cut request cancelled');
        return { state: OperationState.DONE };
      }

      try {
        await Aire.resumeUnpaid({ telefono: number });
        console.debug('[AireProvider][resume] line resumed');

        return { state: OperationState.DONE };
      } catch (resumeError) {
        if (resumeError instanceof ResumeUnpaidErrors.INVALID_CUTOFF_STATE) {
          console.warn(
            '[AireProvider][resume] Ignoring INVALID_CUTOFF_STATE aire error, because the contract is probably activated before.',
          );
          return { state: OperationState.DONE };
        }
        throw resumeError;
      }
    }

    switch (cutRequestState) {
      case 'RES':
      case 'CAN': {
        console.warn(
          `AireLine with telefono:${number} is already resumed, no need to resume it again`,
        );
        break;
      }

      // check if there is a pending cut request
      case 'SOL': {
        await Aire.cancelCutRequest({ telefono: number });
        console.debug(
          '[AireProvider][resume] cut request cancelled, resuming line',
        );
        break;
      }

      // check if cell is cutted
      case 'COR': {
        await Aire.resumeUnpaid({ telefono: number });
        console.debug(
          '[AireProvider][resume] line resumed, cut request cancelled',
        );
        break;
      }
    }

    return { state: OperationState.DONE };
  }

  protected async noAireResume(contractId: number, userId = 0) {
    // create crm event to support to unblock it
    const alive = await getAlive(contractId);
    if (alive?.downState === 'pending') {
      // this is a cancelation of block
      // assume line is already unblocked
      await cancelBlockingTask(SERVICE.CELL, contractId);
      // ignore old task
      await ignoreBlockingTask(SERVICE.CELL, contractId);
    } else {
      await serviceUnblockingTask(SERVICE.CELL, contractId, userId);
      // ignore old task
      await ignoreBlockingTask(SERVICE.CELL, contractId);
    }
  }

  protected async noAireBlock(contractId: number, userId = 0) {
    // create crm event to support to block it
    const alive = await getAlive(contractId);
    if (alive?.downState === 'revoked' && alive?.upState === 'pending') {
      // this is a cancelation of unblock
      // assume line is already blocked
      await cancelBlockingTask(SERVICE.CELL, contractId);
    } else {
      await serviceBlockingTask(SERVICE.CELL, contractId, userId);
    }
    // remove previous unblock task
    await ignoreUnblockingTask(SERVICE.CELL, contractId);
  }

  protected successState(): ServiceState {
    return {
      state: SECTION_STATUS.DONE,
      pendingState: null,
    };
  }
}
