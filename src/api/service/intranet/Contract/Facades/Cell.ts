import {
  CellProvider,
  CellProviderState,
  ContractCondition,
  Facade,
  ProcessState,
  ServiceState,
} from '../contracts';

import AireProvider from './Providers/AireProvider';
import Bonusable from './Bonusable';
import BonusableProvider from './Providers/BonusableProvider';
import { CELL_PROVIDER_CODE } from '@api/constants/contracts';
import LemonProvider from './Providers/LemonProvider';
import assert from 'assert';
import { ensureOfDocument } from '../../GfContractDataCellService';
import { getContractConditions } from '../helpers';

const providers: Record<CELL_PROVIDER_CODE, CellProvider> = {
  [CELL_PROVIDER_CODE.LEMON]: new LemonProvider(),
  [CELL_PROVIDER_CODE.AIRE]: new AireProvider(),
};
export default class Cell extends Bonusable implements Facade {
  /**
   * Check the service activation state.
   *
   * @throws {Error}
   */
  public async execute(contractId: number, userId = 0): Promise<ServiceState> {
    const condition = await getContractConditions(contractId);
    const result = await this.forwardCallToProvider<ServiceState>(
      condition,
      'execute',
      userId,
    );

    // TODO: MOVE IT TO CRON ACTION
    // creates documents
    await ensureOfDocument(condition.dataCell);

    return result as ServiceState;
  }

  /**
   * Get state from third part service.
   *
   * @throws {Error}
   */
  async getState(contractId: number): Promise<CellProviderState> {
    return this.forwardCallToProvider<CellProviderState>(
      await getContractConditions(contractId),
      'getState',
    );
  }

  /**
   * Inactive the related services.
   *
   * @throws {Error}
   */
  public async down(contractId: number, userId = 0) {
    return this.forwardCallToProvider<ProcessState>(
      await getContractConditions(contractId),
      'down',
      userId,
    );
  }

  /**
   * Block the related services.
   *
   * @throws {Error}
   */
  public async block(contractId: number, userId = 0) {
    return this.forwardCallToProvider<ProcessState>(
      await getContractConditions(contractId),
      'block',
      userId,
    );
  }

  /**
   * Unblock the related services.
   *
   * @throws {Error}
   */
  public async resume(contractId: number, userId = 0) {
    return this.forwardCallToProvider<ProcessState>(
      await getContractConditions(contractId),
      'resume',
      userId,
    );
  }

  async activateBonus(
    contractId: number,
    bonusId: number,
    options: Record<string, unknown> = { userId: 0 },
  ) {
    const condition = await getContractConditions(contractId);
    const provider = this.provider(condition.provider.code);

    if (provider instanceof BonusableProvider) {
      await provider.activateBonus(condition, bonusId, options);
    }
  }

  async deactivateBonus(
    contractId: number,
    bonusId: number,
    options: Record<string, unknown> = { userId: 0 },
  ) {
    const condition = await getContractConditions(contractId);
    const provider = this.provider(condition.provider.code);

    if (provider instanceof BonusableProvider) {
      await provider.deactivateBonus(condition, bonusId, options);
    }
  }

  /**
   * Forward a method call to the corresponding CELL provider.
   */
  protected forwardCallToProvider<R = void>(
    condition: ContractCondition,
    callback: string,
    userId?: number,
  ) {
    return this.provider(condition.provider.code)[
      callback as keyof CellProvider
    ](condition, userId) as R;
  }

  /**
   * Get service provider instance.
   */
  protected provider(providerCode: CELL_PROVIDER_CODE): CellProvider {
    assert(
      providerCode,
      `[Facades][provider] Missing provider with code ${providerCode}!`,
    );

    return providers[providerCode];
  }
}
