import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class MissingClientOnSuspending extends AireSyncError {
  protected code = 'suspended_no_client';

  constructor(
    protected aireId: number,
    protected number: string,
    fiscalId: string,
  ) {
    super(aireId, number);
    this.message = `Contracte suspès, però cap client amb fiscalId: ${fiscalId}`;
  }

  group(): RevisionGroup {
    return RevisionGroup.CLIENT;
  }
}
