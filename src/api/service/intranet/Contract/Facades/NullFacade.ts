import {
  Facade,
  OperationState,
  ProcessState,
  ProviderState,
  ServiceState,
} from '../contracts';

import { SECTION_STATUS } from '@api/constants/statuses';

export default abstract class NullFacade implements Facade {
  async execute(contractId: number, userId: number): Promise<ServiceState> {
    return {
      state: SECTION_STATUS.DONE,
      pendingState: null,
    };
  }
  async down(contractId: number, userId: number): Promise<ProcessState> {
    return { state: OperationState.DONE };
  }
  async block(contractId: number, userId: number): Promise<ProcessState> {
    return { state: OperationState.DONE };
  }
  async resume(contractId: number, userId: number): Promise<ProcessState> {
    return { state: OperationState.DONE };
  }
  async getState(contractId: number): Promise<ProviderState> {
    return {
      state: SECTION_STATUS.DONE,
      stateText: null,
      reason: null,
    };
  }
}
