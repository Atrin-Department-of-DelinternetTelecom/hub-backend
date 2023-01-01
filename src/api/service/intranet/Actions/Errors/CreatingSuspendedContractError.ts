import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class CreatingSuspendedContractError extends AireSyncError {
  protected code = 'error_creating_suspended_contract';
  message = 'Error creating local suspended contract';

  group(): RevisionGroup {
    return RevisionGroup.EXECUTION;
  }
}
