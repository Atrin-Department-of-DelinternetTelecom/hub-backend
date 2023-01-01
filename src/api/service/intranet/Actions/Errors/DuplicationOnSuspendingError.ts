import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class DuplicationOnSuspendingError extends AireSyncError {
  protected code = 'duplicate_contract_to_suspend';
  message = "Existeix més d'un contracte local per suspendre";

  group(): RevisionGroup {
    return RevisionGroup.EXECUTION;
  }
}
