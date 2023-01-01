'use strict';

const Field = require('./../Field');

module.exports = class DateTime extends Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'datetime';

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
    this.swagger('format', 'date-time');
    this.sortable();
    this.filterable();
  }
};
