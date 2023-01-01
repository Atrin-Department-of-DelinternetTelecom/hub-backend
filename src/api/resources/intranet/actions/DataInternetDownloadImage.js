'use strict';

const Action = require('./OldFormDataAction');
const ImageField = require('@lib/crud/Fields/Image');
const NumberField = require('@lib/crud/Fields/Number');

module.exports = class DataInternetDownloadImage extends Action {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return [new NumberField('Image Number', 'number').throughPath()];
  }

  uriKey() {
    return 'image/{number}';
  }

  swaggerMethod() {
    return 'get';
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
      operationId: 'downloadImage',
    };
  }

  swaggerResponse() {
    return this.downloadResponse();
  }
};
