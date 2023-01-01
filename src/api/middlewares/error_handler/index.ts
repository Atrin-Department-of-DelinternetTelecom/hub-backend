import e, { Request, Response } from 'express';

import ErrorStackParser from 'error-stack-parser';
import { HttpError } from '@api/http/http_errors';
import QueryString from 'qs';
import { cleanObject } from '@api/utils/tools';
import { getUrl } from '@api/utils/url';
import { handlers } from './handlers';
import { isServerErrorStatus } from '@api/http/http_status';
import { store } from '@lib/exceptions';

function transformError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  for (const handler of handlers) {
    if (handler.condition(error)) return handler.handle(error);
  }

  return new HttpError('INTERNAL_SERVER_ERROR', {
    cause: error,
  });
}

function parseStackTrace(error: unknown) {
  if (error instanceof Error) {
    try {
      return ErrorStackParser.parse(error);
    } catch (e) {
      console.error('parseStackTrace', e);
      return [];
    }
  }

  return [];
}

export function errorHandler(
  _err: unknown,
  req: Request,
  res: Response,
  next?: any,
) {
  const err = transformError(_err);

  if (isServerErrorStatus(err.status)) console.error(err);

  if (!err.expose) {
    console.error(err);
    return res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
    });
  }

  const url = getUrl(req);

  const causeError = err.cause ? (err.cause as Error) : err;

  const httpStatus = err.useOldHttpStatusStrategy ? 200 : err.status;

  if (httpStatus >= 500) {
    store(err, {
      method: req.method,
      path: url.pathname,
      url: decodeURI(req.originalUrl),
      query: Object.fromEntries(new URLSearchParams(req.originalUrl).entries()),
      body: req.body,
      userId: (req as any).user?.id,
    });
  }

  return res.status(httpStatus).json(
    cleanObject({
      code: err.status,
      message: err.message,
      type: err.type,
      stack: err.exposeStack ? parseStackTrace(causeError) : undefined,
    }),
  );
}
