import { RevisionGroup } from '@api/constants/enum';

export abstract class AireSyncError extends Error {
  protected code = 'unknown_error';

  constructor(protected aireId: number, protected number: string) {
    super('Unkowns error');
  }

  abstract group(): RevisionGroup;

  jsonSerialize(): Record<string, any> {
    return {
      aireId: this.aireId,
      code: this.code,
      number: this.number,
      description: this.message,
    };
  }
}
