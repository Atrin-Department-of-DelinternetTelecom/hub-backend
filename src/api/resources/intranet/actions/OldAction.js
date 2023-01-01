'use strict';

const Action = require('@lib/crud/Action');
const SwaggerAction = require('@lib/crud/Traits/SwaggerAction');

module.exports = class OldAction extends Action {
  /**
   * Prepare resource for swager config.
   *
   * @param {Object} request
   * @param {Object} resource
   * @return {Object}
   */
  swaggerConfig(request, resource) {
    const resourceFields = !this.isInline()
      ? []
      : resource
          .fieldCollection(request)
          .forUpdating()
          .primaries()
          .toSwaggerConfig();

    return {
      ...super.swaggerConfig(request, resource),
      operationId: `post${this.name()}`,
      parameters: resource.convertToJson(
        this.fieldCollection(request).toSwaggerConfig().concat(resourceFields),
      ),
      'x-swagger-router-controller': resource.name(),
    };
  }

  /**
   * Request path.
   *
   * @return {string}
   */
  swaggerRoute() {
    return `${this.isInline() ? '{id}' : 'actions'}/${this.uriKey()}`;
  }
};
