import {
  CellProviderState,
  ContractCondition,
  ProcessState,
  ProviderState,
  ServiceState,
} from './types';

export interface Facade {
  /**
   * Check the service activation state.
   *
   * @throws {Error}
   */
  execute(contractId: number, userId: number): Promise<ServiceState>;
  /**
   * Inactive the related services.
   *
   * @throws {Error}
   */
  down(contractId: number, userId: number): Promise<ProcessState>;
  /**
   * Block the related services.
   *
   * @throws {Error}
   */
  block(contractId: number, userId: number): Promise<ProcessState>;
  /**
   * Unblock the related services.
   *
   * @throws {Error}
   */
  resume(contractId: number, userId: number): Promise<ProcessState>;
  /**
   * Get the service state.
   *
   * @throws {Error}
   */
  getState(contractId: number): Promise<ProviderState>;
}

export interface CellProvider {
  /**
   * Check the service activation state.
   *
   * @throws {Error}
   */
  execute(condition: ContractCondition, userId?: number): Promise<ServiceState>;
  /**
   * Check the service state.
   *
   * @throws {Error}
   */
  getState(
    condition: ContractCondition,
    userId?: number,
  ): Promise<CellProviderState>;
  /**
   * Inactive the related services.
   *
   * @throws {Error}
   */
  down(condition: ContractCondition, userId?: number): Promise<ProcessState>;
  /**
   * Block the related services.
   *
   * @throws {Error}
   */
  block(condition: ContractCondition, userId?: number): Promise<ProcessState>;
  /**
   * Unblock the related services.
   *
   * @throws {Error}
   */
  resume(condition: ContractCondition, userId?: number): Promise<ProcessState>;
}
