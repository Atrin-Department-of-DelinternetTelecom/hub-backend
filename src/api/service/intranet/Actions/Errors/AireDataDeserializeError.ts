import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class AireDataDeserializeError extends AireSyncError {
  protected code = 'unserialize_error';
  message = 'Error deserialitzant aireData';

  group(): RevisionGroup {
    return RevisionGroup.DECODE;
  }
}
