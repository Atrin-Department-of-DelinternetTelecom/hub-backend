'use strict';

const Field = require('./../Field');

module.exports = class File extends Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'file';

  /**
   * Preapare field for swagger definition.
   *
   * @return {Object}
   */
  get swaggerDefinition() {
    return {
      ...super.swaggerConfig(),
      type: 'string',
    };
  }
};
