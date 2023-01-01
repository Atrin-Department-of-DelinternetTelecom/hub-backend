import {
  Facade,
  OperationState,
  ProcessState,
  ProviderState,
  ServiceState,
} from '../contracts';
import {
  SECTION_STATUS,
  SECTION_STATUS_PENDINGS,
} from '@api/constants/statuses';
import {
  blockContract,
  delete as deleteRadius,
  restoreContract,
  updateFromContract,
} from '../../RadiusService';
import {
  cancelBlockingTask,
  cancelUnblockingTask,
  executeBlockingTasks,
  executeUnblockingTasks,
  ignoreBlockingTask,
  ignoreUnblockingTask,
  serviceBlockFailed,
  serviceBlockingTask,
  serviceUnblockFailed,
  serviceUnblockingTask,
} from '../helpers/events';
import { getRadiusInfo, removeCpe } from '../../GfContractInternetService';

import Bonusable from './Bonusable';
import { GfBonus } from '@api/models/intranet/intranet_gf_bonus';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { SERVICE } from '@api/constants/contracts';
import assert from 'assert';
import { cpeRadiusError } from '../../CrmInternetService';
import { findOrFail } from '../../Actions/Caches/GfContractSectionStatusCaches';
import { getActualConditionsBySection } from '../../GfContractService';
import { getAlive } from '../../GfContractsUnpaidService';
import { getSectionIdByCode } from '../../GfSectionService';
import { getState } from '../../GfContractSectionStatusService';

export default class Internet extends Bonusable implements Facade {
  /**
   * Based on state do technial operations if needed
   *
   * step1: hi ha direccio
   * step2: agendat
   * step2.5: installation done
   * step2.7: cpe or radius no well configured
   * waitingRadius: tot ok, esperant primera conexio de radius
   */
  async execute(contractId: number, userId: number): Promise<ServiceState> {
    // A: determine current state based on facts
    const { contract, row, status } = await findOrFail<GfContractDataInternet>(
      contractId,
    );
    // deleted service
    if (contract.isSuspended()) {
      return {
        state: status.state,
        pendingState: status.pendingState,
      };
    }
    // activated service
    if (status.state === SECTION_STATUS.DONE) {
      return {
        state: status.state,
        pendingState: null,
      };
    }
    assert(
      row,
      `[FacadeInternet][execute] data internet not found for contract[${contractId}]`,
    );
    // needs installation
    if (row.state !== SECTION_STATUS_PENDINGS.INSTALLED) {
      return {
        state: SECTION_STATUS.PENDING,
        pendingState: row.state as unknown as SECTION_STATUS_PENDINGS,
      };
    }
    // installation done
    // do automatic radius and cpe
    // check radius and cpe state
    // if error, return as 2.7
    // if OK, return waitingRadius
    // update radius service
    await updateFromContract(contractId);
    await row.reload(); // reload section data
    const radiusInfo = await getRadiusInfo(contractId);

    return {
      state: SECTION_STATUS.PENDING,
      pendingState:
        radiusInfo.state != 'ok'
          ? SECTION_STATUS_PENDINGS.RADIUS_OR_CPE_ERROR
          : SECTION_STATUS_PENDINGS.WAITING_FIRST_CONNECTION,
    };
  }

  async down(contractId: number, userId: number): Promise<ProcessState> {
    const dataInternet = await GfContractDataInternet.findOne({
      where: { contractId },
    });

    assert(
      dataInternet,
      `[FacadeFix][down] data internet for contract [${contractId}] not found`,
    );

    await deleteRadius(contractId);

    if (dataInternet.cpeDeviceId) {
      await removeCpe(dataInternet.cpeDeviceId, userId);
    }

    return { state: OperationState.DONE };
  }

  async block(contractId: number, userId: number): Promise<ProcessState> {
    const conditions = await getActualConditionsBySection(contractId);
    //TODO: i didn't see any use-case for this flag (comesFromTask)
    // that means there is no event to trigger the block function
    // I have to wait for any error in the feature!
    const comesFromTask = false;

    if (Number(conditions?.internetExcludeFromRadius)) {
      const alive = await getAlive(contractId);
      assert(alive);

      if (alive.downState === 'revoked' && alive.upState === 'pending') {
        // this is a cancelation of unblock
        // assume line is already blocked
        await cancelUnblockingTask(SERVICE.INTERNET, contractId);
        // ignore previous unblock task
        await ignoreUnblockingTask(SERVICE.INTERNET, contractId);

        return { state: OperationState.DONE };
      } else {
        await serviceBlockingTask(SERVICE.INTERNET, alive.contractId, userId);
        // ignore previous unblock task
        await ignoreUnblockingTask(SERVICE.INTERNET, contractId);

        return { state: OperationState.PENDING };
      }
    } else {
      const result = await blockContract(contractId);
      if (result.success) {
        await executeBlockingTasks(SERVICE.INTERNET, contractId, comesFromTask);

        return { state: OperationState.DONE };
      } else {
        if (!comesFromTask) {
          await serviceBlockFailed(
            SERVICE.INTERNET,
            contractId,
            result.error,
            userId,
          );
        }
        return { state: OperationState.PENDING };
      }
    }
  }

  async resume(contractId: number, userId: number): Promise<ProcessState> {
    const conditions = await getActualConditionsBySection(contractId);
    if (conditions?.internetExcludeFromRadius) {
      // create crm event to support to unblock it
      const alive = await getAlive(contractId);

      assert(alive);

      if (alive.downState === 'pending') {
        // this is a cancelation of block
        // assume line is already unblocked
        await cancelBlockingTask(SERVICE.INTERNET, alive.contractId);
        // ignore previous block task
        await ignoreBlockingTask(SERVICE.INTERNET, alive.contractId);

        return { state: OperationState.DONE };
      } else {
        await serviceUnblockingTask(SERVICE.INTERNET, alive.contractId, userId);
        // ignore previous block task
        await ignoreBlockingTask(SERVICE.INTERNET, alive.contractId);

        return { state: OperationState.PENDING };
      }
    } else {
      const result = await restoreContract(contractId);
      if (result.success) {
        await executeUnblockingTasks(SERVICE.INTERNET, contractId);

        return { state: OperationState.DONE };
      } else {
        console.error(
          `[FacadeInternet][resume][contractId:${contractId}]`,
          'Radius restoreContract failed',
          result,
        );
        await serviceUnblockFailed(
          SERVICE.INTERNET,
          contractId,
          result.error,
          userId,
        );

        return { state: OperationState.PENDING };
      }
    }
  }

  async getState(contractId: number): Promise<ProviderState> {
    const state = await getState(
      contractId,
      await getSectionIdByCode(SERVICE.INTERNET),
    );

    return {
      ...state,
      reason: null,
      stateText: null,
    };
  }

  async doRadius(contractId: number) {
    await updateFromContract(contractId);
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
    contractId: number,
    bonusId: number,
    options: Record<string, unknown> = { ignoreRadius: false },
  ) {
    const bonus = await GfBonus.findByPk(bonusId);
    assert(bonus, `bonus not found`);

    if (bonus.affectRadius() && !options.ignoreRadius) {
      await this.doRadius(contractId);
    }
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
    contractId: number,
    bonusId: number,
    options: Record<string, unknown> = { userId: 0 },
  ) {
    try {
      await this.doRadius(contractId);
    } catch (error) {
      await cpeRadiusError(contractId, options.userId);
    }
  }
}
