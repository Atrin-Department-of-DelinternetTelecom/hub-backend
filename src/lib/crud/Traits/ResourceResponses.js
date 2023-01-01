'use strict';
const CommonResponses = require('./CommonResponses');

module.exports = class SwaggerResource extends CommonResponses {
  indexResponse() {
    return {
      description: `Display list of ${this.name()} items`,
      schema: {
        type: 'object',
        description: 'InternalServerError',
        required: ['meta', 'data', 'links'],
        properties: {
          code: {
            type: 'number',
            example: 200,
          },
          data: {
            type: 'array',
            uniqueItems: true,
            items: {
              $ref: `#/definitions/${this.name()}`,
            },
            minItems: 1,
          },
          meta: {
            type: 'object',
            properties: {
              current_page: {
                type: 'number',
                example: 1,
              },
              total: {
                type: 'number',
              },
            },
            required: ['current_page', 'total'],
          },
        },
      },
    };
  }

  viewResponse() {
    return {
      description: `Create new resource of ${this.name()} for given request`,
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: {
            $ref: `#/definitions/${this.name()}`,
          },
          meta: {
            type: 'object',
            properties: {
              code: {
                type: 'number',
                example: 201,
              },
              status: {
                type: 'string',
                minLength: 1,
                example: 'success',
              },
            },
            required: ['code', 'message', 'status'],
          },
        },
        description: `Resource created`,
      },
    };
  }

  creationResponse() {
    return {
      description: `Create new resource of ${this.name()} for given request`,
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: {
            $ref: `#/definitions/${this.name()}`,
          },
          meta: {
            type: 'object',
            properties: {
              code: {
                type: 'number',
                example: 201,
              },
              message: {
                type: 'string',
                minLength: 1,
                example: 'Resource created',
              },
              status: {
                type: 'string',
                minLength: 1,
                example: 'success',
              },
            },
            required: ['code', 'message', 'status'],
          },
        },
        description: `Resource created`,
      },
    };
  }

  updateResponse() {
    return {
      description: `Update a ${this.name()} for given id`,
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: {
            $ref: `#/definitions/${this.name()}`,
          },
          meta: {
            type: 'object',
            properties: {
              code: {
                type: 'number',
                example: 200,
              },
              message: {
                type: 'string',
                minLength: 1,
                example: 'Resource created',
              },
              status: {
                type: 'string',
                minLength: 1,
                example: 'success',
              },
            },
            required: ['code', 'message', 'status'],
          },
        },
        description: `Resource updated`,
      },
    };
  }
};
