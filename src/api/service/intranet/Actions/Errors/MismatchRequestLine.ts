import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class MismatchRequestLine extends AireSyncError {
  protected code = 'mismatch_request_line';
  message = 'Request line not found';

  group(): RevisionGroup {
    return RevisionGroup.EXECUTION;
  }
}
