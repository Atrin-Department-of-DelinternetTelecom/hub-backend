import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class ImportingAireContractError extends AireSyncError {
  protected code = 'error_importing_aire_contracts';

  constructor(
    protected aireId: number,
    protected number: string,
    error: Error,
  ) {
    super(aireId, number);
    this.message = `Error al importar contractes d'aire (${error.toString()})`;
  }

  group(): RevisionGroup {
    return RevisionGroup.DECODE;
  }
}
