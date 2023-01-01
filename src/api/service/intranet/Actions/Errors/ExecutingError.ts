import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class ExecutingError extends AireSyncError {
  protected code = 'error_executing';

  constructor(
    protected aireId: number,
    protected number: string,
    error: Error,
  ) {
    super(aireId, number);
    this.message = `Trobat contracte local pendent i actiu a aire, però 'checkExecutedStates' retorna error (${error.toString()})`;
  }

  group(): RevisionGroup {
    return RevisionGroup.EXECUTION;
  }
}
