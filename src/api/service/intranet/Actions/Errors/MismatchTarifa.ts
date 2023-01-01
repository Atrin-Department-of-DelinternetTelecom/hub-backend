import { AireSyncError } from './AireSyncError';
import { LineTarifa } from '@delinternet/sdk-aire';
import { RevisionGroup } from '@api/constants/enum';

export class MismatchTarifa extends AireSyncError {
  protected code = 'mismatch_fee_group';
  message = 'Request line not found';

  constructor(
    protected aireId: number,
    protected number: string,
    protected tarfia: LineTarifa,
  ) {
    super(aireId, number);
    this.message = `No local fee matching ${this.tarfia.siglas} - ${this.tarfia.nombre}`;
  }

  group(): RevisionGroup {
    return RevisionGroup.FEE;
  }
}
