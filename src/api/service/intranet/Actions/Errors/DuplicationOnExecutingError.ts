import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class DuplicationOnExecutingError extends AireSyncError {
  protected code = 'pending_execute_duplicated';
  message = "Existeix més d'un contracte local pendent d'executar";

  group(): RevisionGroup {
    return RevisionGroup.EXECUTION;
  }
}
