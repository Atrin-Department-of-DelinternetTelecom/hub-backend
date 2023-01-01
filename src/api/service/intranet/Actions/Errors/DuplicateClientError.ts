import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class DuplicateClientError extends AireSyncError {
  protected code = 'duplicated_fiscalId';

  constructor(
    protected aireId: number,
    protected number: string,
    fiscalId: string,
  ) {
    super(aireId, number);
    this.message = `Trobat més d'un client amb el mateix fiscalId (${fiscalId})`;
  }

  group(): RevisionGroup {
    return RevisionGroup.CLIENT;
  }
}
