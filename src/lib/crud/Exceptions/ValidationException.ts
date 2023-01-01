'use strict';

import { errors } from '@api/http/http_errors';

type Message = string | { [key: string]: any };

export default class ValidationException extends errors.BadRequest {
  code = 400;

  constructor(message: Message) {
    super('Request validation failed.');

    if (typeof message === 'string') {
      this.message = message;
    } else if (typeof message === 'object') {
      const firstError = Object.keys(message)[0];

      this.message = Array.isArray(message[firstError])
        ? message[firstError][0].message
        : message[firstError].message;
    }
  }

  static throwUnless(condition: boolean, errors: Message) {
    if (!condition) {
      throw new this(errors);
    }
  }
}
