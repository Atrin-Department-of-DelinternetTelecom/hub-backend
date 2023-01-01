'use strict';

const Action = require('./OldFormDataAction');
const ImageField = require('@lib/crud/Fields/Image');
const NumberField = require('@lib/crud/Fields/Number');

module.exports = class DataInternetUploadImage extends Action {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return [
      new NumberField('Image Number', 'number').throughPath(),

      new ImageField('Image').required(),
    ];
  }

  uriKey() {
    return 'image/{number}';
  }

  /**
   * Prepare resource for swager config.
   *
   * @param {Object} request
   * @return Object
   */
  swaggerConfig(request, resource) {
    return {
      ...super.swaggerConfig(request, resource),
      operationId: 'uploadImage',
    };
  }
};
