import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class MissingTarifa extends AireSyncError {
  protected code = 'missing_tarifa';
  message = 'The line doesnt have any tarfia';

  group(): RevisionGroup {
    return RevisionGroup.FEE;
  }
}
