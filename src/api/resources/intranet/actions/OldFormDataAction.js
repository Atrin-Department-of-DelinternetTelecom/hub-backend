'use strict';

const FormDataAction = require('@lib/crud/FormDataAction');

module.exports = class OldFormDataAction extends FormDataAction {
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
      parameters: this.fieldCollection(request)
        .toSwaggerConfig()
        .concat(resourceFields),
      operationId: `post${this.name()}`,
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
