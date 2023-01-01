import {
  CELL_ACTUAL_MODALITY,
  CELL_PROVIDER_CODE,
} from '@api/constants/contracts';
import {
  CellProvider,
  CellProviderState,
  ContractCondition,
  OperationState,
  ProcessState,
  ServiceState,
} from '../../contracts';
import {
  LEMON_PORTABILITY_STATUS,
  LEMON_STATUS,
  SECTION_STATUS,
  SECTION_STATUS_PENDINGS,
} from '@api/constants/statuses';

import BonusableProvider from './BonusableProvider';
import { GfBonus } from '@api/models/intranet/intranet_gf_bonus';
import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { LemonLine } from '@api/models/intranet/intranet_lemon_line';
import { USAGE_STATUS } from '@del-internet/lemon';
import assert from 'assert';
import { firstPopulated } from '@api/utils/helpers';
import { lemon } from '@lib/lemon';
import to from 'await-to-js';

export default class LemonProvider
  extends BonusableProvider
  implements CellProvider
{
  async execute(condition: ContractCondition): Promise<ServiceState> {
    const { dataCell, cellFee, client } = condition;
    if (!dataCell.providerRequestCode) {
      const number = await this.requestLine(dataCell, cellFee, client);
      await dataCell.update({
        providerRequestCode: firstPopulated([number, dataCell.number]),
        number: firstPopulated([dataCell.number, number]),
      });
    }
    // if the `number` exists means that the contract exists on the `Lemon`
    if (dataCell.providerRequestCode !== null) {
      const { state, stateText } = await this.getState(condition);
      return this.serviceState(state, stateText);
    }
    // get last state
    const { state, stateText } = await this.getState(condition);

    if (state !== SECTION_STATUS.DONE) {
      return this.serviceState(state, stateText);
    }

    return this.serviceState(SECTION_STATUS.DONE);
  }

  async requestLine(
    dataCell: GfContractDataCell,
    cellFee: GfCellProviderFee,
    client: GfClient,
  ): Promise<string> {
    assert(client.fiscalId, `The client fiscal id is mandatory for Lemon`);
    // Check the client has been registered on the Lemon or do it!
    await this.ensureClientExistsOnLemon(client);
    // Then request a new line for it
    assert(dataCell.iccPlusControlDigit, `The icc&dc is mandatory for Lemon`);

    const payload = {
      fiscalId: client.fiscalId,
      sim: dataCell.iccPlusControlDigit!,
      tarifaId: cellFee.providerFeeId,
    };

    if (dataCell.portability) {
      payload.operadorDonante = 1;
      payload.tipoFacturacion =
        dataCell.actualModality === CELL_ACTUAL_MODALITY.POS_PAGO ? 1 : 0;
      payload.numero = dataCell.number;
    }

    if (
      dataCell.portability &&
      dataCell.actualModality === CELL_ACTUAL_MODALITY.PRE_PAGO
    ) {
      assert(dataCell.origenIccPlusControlDigit, 'Origin icc is required');
      payload.simO = dataCell.origenIccPlusControlDigit;
    }

    const { data } = dataCell.portability
      ? await lemon.cell.createNewPortability(payload)
      : await lemon.cell.createNewLine(payload);

    return data.numero ?? dataCell.number;
  }

  async ensureClientExistsOnLemon(client: GfClient) {
    const [error] = await to(lemon.client.checkClient(client.fiscalId));

    if (error) {
      await lemon.client.createClient(await client.serializeForLemon());
    }
  }

  async getState({
    dataCell,
    client,
  }: ContractCondition): Promise<CellProviderState> {
    assert(
      dataCell.number,
      `[LemonProvider][getState] invalid cell number [${dataCell.number}]`,
    );
    const [error, response] = await to(
      lemon.cell.getCellUsageByNumber(dataCell.number),
    );
    const providerState: CellProviderState = {
      state: SECTION_STATUS.PENDING,
      stateText: null,
      provider: CELL_PROVIDER_CODE.LEMON,
      reason: null,
    };

    if (error === null) {
      return {
        ...providerState,
        state: this.getLineState(response.data.status),
        stateText: response.data.status,
      };
    }
    assert(
      client.fiscalId,
      `[LemonProvider][getState] client[${client.id}] doesn't have DNI!`,
    );
    // check termination
    const [terminateError, terminated] = await to(
      this.terminated(client.fiscalId, dataCell.number),
    );

    if (terminated) {
      return {
        ...providerState,
        state: SECTION_STATUS.SUSPENDED,
      };
    }

    // check portability state
    if (dataCell.portability) {
      const { data } = await lemon.cell.getPortabilityByNumber(dataCell.number);
      return {
        ...providerState,
        state:
          data.pop()?.newStatus !== LEMON_PORTABILITY_STATUS.FAILED
            ? SECTION_STATUS.PENDING
            : SECTION_STATUS.ERROR,
        stateText: data.pop()?.newStatus ?? null,
        reason: firstPopulated([data.pop()?.mensaje]),
      };
    }
    // unknown state
    throw error ?? terminateError;
  }

  async terminated(fiscalId: string, number: string) {
    const { data } = await lemon.cell.getCellByFiscalId(fiscalId);

    const line = data.find(
      ({ numero, termination_date }) => numero === number && termination_date,
    );

    return line !== undefined;
  }

  async down(conditions: ContractCondition): Promise<ProcessState> {
    const [error, providerState] = await to(this.getState(conditions));

    if (error || providerState.state !== SECTION_STATUS.SUSPENDED) {
      throw new Error('Feature not implemented yet!');
    }

    return {
      state: OperationState.DONE,
    };
  }

  async block({
    dataCell: { number },
    contract,
  }: ContractCondition): Promise<ProcessState> {
    assert(
      number,
      `[LemonProvider][block] Missing cell number [${contract.id}]`,
    );

    await lemon.cell.block(number);

    return { state: OperationState.DONE };
  }

  async resume({
    dataCell: { number },
    contract,
  }: ContractCondition): Promise<ProcessState> {
    assert(
      number,
      `[LemonProvider][resume] Missing cell number [${contract.id}]`,
    );
    const [resumeError] = await to(lemon.cell.unblock(number));

    if (resumeError === null) {
      return { state: OperationState.DONE };
    }
    // failed to unblock by the provider api
    const line = await LemonLine.findOne({
      where: { number, gf_contract_id: contract.id },
    });
    // unblock failed
    if (line === null || line.isActive()) {
      throw resumeError;
    }
    // prevent error when line is suspended on the Lemon
    return { state: OperationState.DONE };
  }

  protected serviceState(state: SECTION_STATUS, stateText?: string | null) {
    const pending = state !== SECTION_STATUS.DONE;
    const pendingState = pending ? this.pendingState(stateText) : null;

    return pending
      ? { state: SECTION_STATUS.PENDING, pendingState }
      : { state: SECTION_STATUS.DONE, pendingState };
  }

  protected pendingState(stateText?: string | null) {
    return stateText === LEMON_STATUS.PRE_ACTIVATE
      ? SECTION_STATUS_PENDINGS.WAITFOR_PROVIDER
      : SECTION_STATUS_PENDINGS.EXECUTED;
  }

  protected getLineState(status: string) {
    if (status === USAGE_STATUS.ACTIVE) {
      return SECTION_STATUS.DONE;
    }

    return status === USAGE_STATUS.BLOCKED
      ? SECTION_STATUS.BLOCKED
      : SECTION_STATUS.PENDING;
  }
  /**
   * Activate a bonus for the service.
   *
   * This method should contain the logic required to activate a bonus on the service
   * (e.g., applying discounts, enabling special features, etc.).
   *
   * @throws {Error} If the bonus activation process fails due to invalid state, service unavailability, or other unforeseen issues.
   */
  async activateBonus(
    condition: ContractCondition,
    bonusId: number,
    options: Record<string, unknown>,
  ) {
    const bonus = await GfBonus.findByPk(bonusId, {
      attributes: ['providerCode'],
      raw: true,
    });
    assert(
      bonus,
      `${__filename}@activateBonus: Bonus with id ${bonusId} not found!`,
    );
    assert(
      bonus.providerCode,
      `${__filename}@activateBonus: Bonus with id ${bonusId} has invalid providerCode!`,
    );
    assert(
      condition.dataCell.number,
      `${__filename}@activateBonus: Invalid phone number!`,
    );

    return lemon.cell.addBonus(
      condition.dataCell.number!,
      Number(bonus.providerCode),
    );
  }

  /**
   * Deactivate a bonus for the service.
   *
   * This method should contain the logic required to deactivate a bonus on the service
   * (e.g., removing discounts, disabling special features, etc.).
   *
   * @throws {Error} If the bonus deactivation process fails due to invalid state, service unavailability, or other unforeseen issues.
   */
  async deactivateBonus(
    condition: ContractCondition,
    bonusId: number,
    options: Record<string, unknown>,
  ) {
    // nothing to do here
  }
}
