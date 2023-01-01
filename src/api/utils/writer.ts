import { Response } from 'express';
import { ResponsePayload } from './response';
import assert from 'assert';
import contentDisposition from 'content-disposition';
import { errorHandler } from '@api/middlewares/error_handler';
import { errors } from '@api/http/http_errors';
import mime from 'mime-types';

/**
 * @deprecated DO NOT USE in controllers
 */
export function writeJson(res: Response, response: unknown) {
  const { req } = res;

  if (response instanceof Error) {
    // TODO(erfan) TODO(refactor) this condition can be removed after migration to ne error handling system
    return errorHandler(response, req, res);
  }

  if (response instanceof ResponsePayload) {
    return res.status(response.code).json(response.payload);
  }

  const error = new errors.InternalServerError('Unknown response type');

  return errorHandler(error, req, res);
}

export function writeFile(
  response: {
    setHeader: Response['setHeader'];
    send: (arg0: any) => void;
  },
  { filename, buffer, type }: any,
) {
  if (!buffer?.length) {
    console.warn('bad buffer type', buffer);
    throw new Error(`Bad buffer type. ${buffer}`);
  }

  const contentType = mime.contentType(filename);
  assert(contentType);

  response.setHeader('Content-Type', contentType);
  response.setHeader(
    'Content-Disposition',
    contentDisposition(filename, {
      type: type ?? 'inline',
    }),
  );
  response.setHeader('Content-Length', buffer.length);
  response.send(buffer);
}
