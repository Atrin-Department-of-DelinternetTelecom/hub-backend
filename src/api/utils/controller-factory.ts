/* eslint-disable @typescript-eslint/no-explicit-any */
import { errorHandler } from '@api/middlewares/error_handler';
import type {
  Swagger20Request,
  SwaggerRouter20HandlerFunction,
} from '@erfanium/swagger-tools';
import assert from 'assert';
import type { Request as ExpressRequest, Response } from 'express';
import { URL } from 'url';
import { respondSuccess, ResponsePayload } from './response';
import { writeJson } from './writer';

const { fromEntries, entries } = Object;
export interface Query {
  size?: number;
  page?: number;
  url?: URL;
  [k: string]: any;
}

type Request = Swagger20Request<any> &
  ExpressRequest & {
    user: any;
    query: Query;
    body: any;
    files?: Record<string, any>;
  };

type Handler = (req: Request, res: Response) => unknown;

type RouterHandlerFunction = SwaggerRouter20HandlerFunction & {
  inject(params: {
    params?: Record<string, any>;
    body?: Record<string, any>;
    user?: { userId: number };
  }): Promise<any>;
};

export interface File {
  data: Buffer;
  encoding: string;
  md5: string;
  mimetype: string;
  mv: () => void;
  name: string;
  size: number;
  tempFilePath: string;
  truncated: boolean;
}

export function createRoute({
  handler,
}: {
  handler: Handler;
}): RouterHandlerFunction {
  const fn: RouterHandlerFunction = async (req, res, next) => {
    let result: any;

    try {
      result = await handler(req as Request, res as Response);
    } catch (e) {
      // response have been already sended. nothing to do
      if (res.headersSent) return console.error(e);
      // we should call error handler here, because express can't detect handler promise rejections.
      // can be removed after migration to fastify
      return errorHandler(e, req as Request, res as Response);
    }

    // response have been already sended. nothing to do
    if (res.headersSent) return;

    if (!result && !res.headersSent) {
      // end the request if there's not result to write
      return res.end();
    }

    if (result instanceof Error) {
      throw new Error(
        'You have returned a value instanceof Error in your controller. needs refactor',
      );
    }

    const response =
      result instanceof ResponsePayload ? result : respondSuccess(result);
    if (response.is2xx()) {
      return writeJson(res as Response, response);
    } else {
      // deprecated retuning ResponsePayloadError as return value

      const error = response.getHttpError();
      assert(error, 'non 2xx legacy response without HttpError attached');

      return errorHandler(error, req as Request, res as Response);
    }
  };

  fn.inject = async function ({
    params,
    body,
    user,
  }: {
    params?: Record<string, any>;
    body?: Record<string, any>;
    user?: { userId: number };
  }) {
    const req = {
      swagger: {
        params: fromEntries(
          entries(params ?? {}).map(([key, value]) => [key, { value }]),
        ),
      },
      body,
      user,
    } as Request;

    const response = await handler(req, {} as Response);
    if (response instanceof ResponsePayload) {
      return response.unwrap();
    }
    return response;
  };

  return fn;
}
