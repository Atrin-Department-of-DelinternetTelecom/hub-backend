import { HttpError, errors as HttpErrors } from '@api/http/http_errors';

import { Status } from '@api/http/http_status';
import { URL } from 'url';
import assert from 'assert';

interface CommonBody {
  code: number;
  meta?: unknown;
  message?: string;
  errors?: unknown;
  data?: any;
}

export class ResponsePayload<T extends CommonBody = CommonBody> {
  code: number;
  payload: T;
  #httpError?: HttpError;

  constructor(code: number, payload: T, httpError?: HttpError) {
    this.code = code;
    this.payload = payload;

    if (!this.is2xx()) {
      // returning errors as values is deprecated, throw HttpError
      this.#httpError = httpError;
    }
  }

  is2xx(): boolean {
    const status = this.payload.code ?? this.code;
    return status >= 200 && status < 300;
  }

  /**
   * will unbox the Response payload. it will throw if status is not 2xx
   * @returns
   */
  unwrap() {
    if (this.is2xx()) {
      return this.payload.data;
    }

    const error = new HttpError(
      `HTTP Error: ${this.code} ${this.payload?.message}`,
    );
    throw error;
  }

  /**
   * Replace entire data with given data.
   */
  replace(data: any) {
    this.payload.data = data;

    return this;
  }

  /**
   * Replace entire data with transformed data.
   */
  transform(callback: <T>(data: T) => T) {
    return this.replace(callback(this.payload.data) ?? this.payload.data);
  }

  /**
   * create HttpError based on old errors
   */
  getHttpError(): HttpError | undefined {
    return this.#httpError;
  }
}

export function is2xx(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * @param {ResponsePayload | any} response
 */
export const unwrapResponse = (response: { unwrap: () => any }) => {
  if (!(response instanceof ResponsePayload)) return response;
  return response.unwrap();
};

/**
 *
 * @deprecated DO NOT USE
 */
export const isResponsePayload = (
  result: any,
): result is ResponsePayload<any> => {
  return result instanceof ResponsePayload;
};

/**
 * @deprecated throw http error
 */
export const respondNotFound = function (message: string, meta = {}) {
  assert(message, `message is required. got ${message}`);
  return new ResponsePayload(
    Status.NotFound,
    {
      code: Status.NotFound,
      message,
      meta,
    },
    new HttpErrors.NotFound(message),
  );
};

/**
 *
 * @deprecated throw http error
 * @param {string} message
 * @param {*} meta
 * @param {*} errors
 * @returns
 */
export const respondBadRequest = function (
  message: string,
  meta = {},
  errors = null,
) {
  assert(message, `message is required. got ${message}`);
  return new ResponsePayload(
    Status.BadRequest,
    {
      code: Status.BadRequest,
      message,
      errors,
      meta,
    },
    new HttpErrors.BadRequest(message),
  );
};

/**
 * @deprecated throw http error
 */
export const respondConflict = function (message: string, meta = {}) {
  assert(message, `message is required. got ${message}`);
  return new ResponsePayload(
    Status.Conflict,
    {
      code: Status.Conflict,
      message,
      meta,
    },
    new HttpErrors.Conflict(message),
  );
};

/**
 * @deprecated throw http error
 */
export const respondInternalServerError = function (
  message: string,
  meta = {},
) {
  assert(message, `message is required. got ${message}`);
  throw new HttpErrors.InternalServerError(message);
};

/**
 * @deprecated throw http error
 */
export const respondWithError = (error: { message: any }) => {
  return respondInternalServerError(error.message);
};

export const respondCreated = function (
  data: any,
  meta?: unknown,
  message?: string,
) {
  return new ResponsePayload(Status.Created, {
    code: Status.Created,
    data,
    meta,
    message,
  });
};

/**
 * @deprecated
 * @param data
 * @param meta
 * @returns
 */
export const respondSuccess = function (data: any, meta = {}) {
  return new ResponsePayload(Status.OK, {
    code: Status.OK,
    data,
    meta,
  });
};

export const respondSuccessWithPagination = function (
  data: any,
  total: any,
  perPage: number | undefined,
  currentPage: number | undefined,
  url: URL | undefined,
  extra = undefined,
) {
  return new ResponsePayload(Status.OK, {
    code: Status.OK,
    data,
    meta: {
      current_page: currentPage,
      total,
    },
    extra,
  });
};

export const respondOK = function (message: string, meta = {}) {
  return new ResponsePayload(Status.OK, {
    code: Status.OK,
    message,
    meta,
  });
};

export const respondNotContent = function (message: string, meta = {}) {
  return new ResponsePayload(Status.NoContent, {
    code: Status.NoContent,
    message,
    meta,
  });
};
