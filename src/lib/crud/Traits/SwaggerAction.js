'use strict';
const Array = require('./../Fields/Array');
const CommonResponses = require('./CommonResponses');

module.exports = class SwaggerAction extends CommonResponses {
  /**
   * Request call method.
   *
   * @return {string}
   */
  swaggerMethod() {
    return 'post';
  }

  /**
   * Request path.
   *
   * @return {string}
   */
  swaggerRoute() {
    return `actions/${this.uriKey()}`;
  }

  /**
   * Prepare resource for swager config.
   *
   * @param {Object} request
   * @param {Object} resource
   * @return {Object}
   */
  swaggerConfig(request, resource) {
    const fields = this.fieldCollection(request)
      .authorize(request)
      .toSwaggerConfig();

    if (!this.isDirect()) {
      const resources = new Array('Resources')
        .required(!this.isStandalone())
        .nullable(this.isStandalone())
        .swaggerConfig();

      fields.push(resources);
    }

    return {
      tags: [`${resource.uriKey()}-${this.name()}`],
      summary: `Your action ${this.name()} ${this.swaggerMethod()} endpoint`,
      description: `Run action for given resources`,
      operationId: `handle`,
      security: [{ Bearer: [] }],
      consumes: ['application/json'],
      produces: ['application/json'],
      parameters: resource.convertToJson(fields),
      responses: {
        200: this.swaggerResponse(),
        ...this.commonResponses(),
      },
      'x-swagger-router-controller': 'ResourceActionController',
      'x-resource-name': resource.uriKey(),
      'x-action-name': this.uriKey(),
    };
  }

  /**
   * Prepare resource for swager config.
   *
   * @return {Object}
   */
  swaggerResponse() {
    return {
      description: `Run action for given resources`,
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
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
};
