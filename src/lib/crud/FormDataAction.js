'use strict';

const Action = require('./Action');

module.exports = class FormDataAction extends Action {
  /**
   * Get collection of fields.
   *
   * @param {Object} request
   * @return {any}
   */
  fieldCollection(request) {
    const callback = function (field) {
      return field.in === 'body' ? field.through('formData') : field;
    };

    return super.fieldCollection(request).map(callback);
  }

  /**
   * Prepare resource for swager config.
   *
   * @param {Object} request
   * @param {Object} resource
   * @return {Object}
   */
  swaggerConfig(request, resource) {
    return {
      ...super.swaggerConfig(request, resource),
      parameters: this.fieldCollection(request).toSwaggerConfig(),
      consumes: ['multipart/form-data'],
    };
  }
};
