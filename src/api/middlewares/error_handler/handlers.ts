import { errors, HttpError } from '@api/http/http_errors';
import { AccessDeniedError } from '@api/security';

export interface ErrorHandle {
  condition(error: unknown): boolean;
  handle(error: unknown): HttpError;
}

class InvalidSchemaError extends errors.BadRequest {
  type = 'INVALID_SCHEMA';
}

const sequelizeError = [
  'OBJECT_MISSING_REQUIRED_PROPERTY',
  'INVALID_TYPE',
  'PATTERN',
  'ENUM_MISMATCH',
  'MIN_LENGTH',
  'MAX_LENGTH',
];

export const handlers: ErrorHandle[] = [
  {
    condition: (error) => error instanceof AccessDeniedError,
    handle() {
      return new errors.Unauthorized('Error: Unauthorized', {
        exposeStack: false,
      });
    },
  },
  {
    condition: (error: unknown) => {
      if (!error || typeof error !== 'object' || !('code' in error)) {
        return false;
      }

      return error.code === 'SCHEMA_VALIDATION_FAILED';
    },
    handle(error: {
      paramName: string;
      results: {
        errors: {
          code: string;
          message: string;
          path: string[];
        }[];
      };
    }) {
      const firstError = error.results.errors[0];
      const path = [error.paramName, ...firstError.path];

      return new InvalidSchemaError(
        `${firstError.message}. path: ${path.join('.')}`,
        {
          exposeStack: false,
        },
      );
    },
  },
  {
    condition: (error) => error instanceof Error,
    handle(error: Error) {
      const newError = new errors.InternalServerError(error.message, {
        cause: error,
        expose: true,
      });

      newError.stack = error.stack;
      return newError;
    },
  },
];
