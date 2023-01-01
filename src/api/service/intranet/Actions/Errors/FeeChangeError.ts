import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class FeeChangeError extends AireSyncError {
  protected code = 'fee_change_error';
  message = "Canvi de tarifa, però la nova tarifa no s'ha trobat";

  group(): RevisionGroup {
    return RevisionGroup.FEE;
  }
}
