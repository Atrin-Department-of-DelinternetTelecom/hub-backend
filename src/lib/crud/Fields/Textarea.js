'use strict';

const Field = require('./../Field');

module.exports = class Textarea extends Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'textarea';

  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {string} name
   * @param  {string} attribute
   * @constructor
   */
  constructor(name, attribute = null) {
    super(name, attribute);

    this.swagger('type', 'string');
  }
};
