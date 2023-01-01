import * as models from '@api/models';

import { AireSyncError } from './AireSyncError';
import { RevisionGroup } from '@api/constants/enum';

export class CreatingLinkError extends AireSyncError {
  protected code = 'error_creating_link';

  constructor(
    protected aireId: number,
    protected number: string,
    pendingContract: models.AnyModel,
  ) {
    super(aireId, number);
    this.message = `ContractId: ${pendingContract.id} - Not linked after suspended`;
  }

  group(): RevisionGroup {
    return RevisionGroup.EXECUTION;
  }
}
