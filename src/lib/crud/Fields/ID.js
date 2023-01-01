'use strict';

const Field = require('./Number');

module.exports = class ID extends Field {
  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {string} name
   * @param  {string} attribute
   * @constructor
   */
  constructor(name = null, attribute = null) {
    super(name ?? 'ID', attribute ?? 'id');
    this.throughPath()
      .primaryKey()
      .hideWhenCreation()
      .default(0)
      .sortable()
      .filterable();
  }
};
