import { Response } from 'express';

type UnknownRecord = Record<string, unknown>;

export interface ResourceResponse extends Response {
  respondCreated: (data: UnknownRecord) => Response;
  respondUpdated: (data: UnknownRecord) => Response;
  respondDeleted: (data: UnknownRecord) => Response;
  respondSuccess: (data: UnknownRecord) => Response;
  respondError: (data: Error) => Response;
  respondNotFound: (data: Error) => Response;
  respondValidationFailed: (data: Error) => Response;
  respondInternalServerError: (data: Error) => Response;
}
