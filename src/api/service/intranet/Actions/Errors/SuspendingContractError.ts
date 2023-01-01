import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class SuspendingContractError extends AireSyncError {
  protected code = 'error_suspending_contract';

  constructor(
    protected aireId: number,
    protected number: string,
    error: Error,
  ) {
    super(aireId, number);
    this.message = `Error while suspending this contract (${error.toString()})`;
  }

  group(): RevisionGroup {
    return RevisionGroup.EXECUTION;
  }
}
