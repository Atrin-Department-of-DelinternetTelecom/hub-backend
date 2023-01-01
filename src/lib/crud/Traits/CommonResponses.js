'use strict';

module.exports = class {
  downloadResponse() {
    return {
      description: 'Download file',
      schema: {
        type: 'file',
      },
    };
  }

  internalServerErrorResponse() {
    return this.simpleResponse(
      500,
      'Internal Server Error',
      'failed',
      'Something went wrong',
    );
  }

  notFoundResponse() {
    return this.simpleResponse(404, 'Requested URL Not Found', 'failed');
  }

  successResponse() {
    return this.simpleResponse();
  }

  unauthorizedResponse() {
    return this.simpleResponse(401, 'Unauthorized Request ', 'failed');
  }

  simpleResponse(
    code = 200,
    description = 'Request Done',
    status = 'success',
    message,
  ) {
    return {
      description: description,
      schema: {
        type: 'object',
        description: description,
        required: ['meta'],
        properties: {
          meta: {
            type: 'object',
            required: ['code', 'status', 'message'],
            properties: {
              code: {
                type: 'number',
                example: code,
              },
              message: {
                type: 'string',
                minLength: 1,
                example: message ?? description,
              },
              status: {
                type: 'string',
                minLength: 1,
                example: status,
              },
            },
          },
        },
      },
    };
  }

  commonResponses() {
    return {
      401: this.unauthorizedResponse(),
      404: this.notFoundResponse(),
      500: this.internalServerErrorResponse(),
    };
  }
};
