'use strict';

const Field = require('./../Field');

module.exports = class Text extends Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'string';
};
