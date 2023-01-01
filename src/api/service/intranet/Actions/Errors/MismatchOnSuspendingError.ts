import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class MismatchOnSuspendingError extends AireSyncError {
  protected code = 'nif_mismatch_while_suspending';
  message =
    'Existeix un contracte pendent de suspendre, però no coincideix el NIF';

  group(): RevisionGroup {
    return RevisionGroup.CLIENT;
  }
}
