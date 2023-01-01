//@ts-check
'use strict';

module.exports = class {
  /**
   * Request path.
   *
   * @return {string}
   */
  swaggerRoute() {
    return `scopes/${this.uriKey()}`;
  }

  /**
   * Prepare resource for swagger config.
   *
   * @param {Object} request
   * @return {Object}
   */
  swaggerConfig(request, resource) {
    return {
      'x-pagination': true,
      'x-filter': true,
      tags: [resource.uriKey()],
      summary: `Your scope ${this.name()} GET endpoint`,
      description: `Get all ${this.name()} of ${resource.label()}`,
      operationId: `handle`,
      security: [{ Bearer: [] }],
      consumes: ['application/json'],
      produces: ['application/json'],
      parameters: [],
      responses: {
        200: resource.indexResponse(),
        ...resource.commonResponses(),
      },
      'x-swagger-router-controller': 'ResourceScopeController',
      'x-resource-name': resource.uriKey(),
      'x-scope-name': this.uriKey(),
    };
  }
};
