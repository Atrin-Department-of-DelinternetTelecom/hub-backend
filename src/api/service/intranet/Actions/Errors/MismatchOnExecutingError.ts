import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class MismatchOnExecutingError extends AireSyncError {
  protected code = 'pending_execute_wrong_fiscalId';
  message =
    "Existeix un contracte pendent d'executar, però no coincideix el NIF";

  group(): RevisionGroup {
    return RevisionGroup.EXECUTION;
  }
}
