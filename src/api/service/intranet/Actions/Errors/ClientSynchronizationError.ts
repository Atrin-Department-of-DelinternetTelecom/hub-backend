import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class ClientSynchronizationError extends AireSyncError {
  protected code = 'client_not_sincronized_to_aire';

  group(): RevisionGroup {
    return RevisionGroup.CLIENT;
  }

  constructor(
    protected aireId: number,
    protected number: string,
    fiscalId: string,
  ) {
    super(aireId, number);
    this.message = `Client trobat pero no sincronitzat a aire (${fiscalId})`;
  }
}
