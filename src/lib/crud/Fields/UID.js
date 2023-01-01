'use strict';

const Field = require('./Number');
const config = require('@config');

module.exports = class UID extends Field {
  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {string} name
   * @param  {string} attribute
   * @constructor
   */
  constructor(name = null, attribute = null) {
    super(name ?? 'UID', attribute ?? 'uid');
    this.default(config.get('index.intranet.uid'));
  }
};
