'use strict';

const pluralize = require('pluralize');
const _ = require('lodash');

module.exports = class {
  /**
   * Get the uri key.
   *
   * @return {string}
   */
  uriKey() {
    return _.kebabCase(pluralize(this.name()));
  }

  /**
   * Get name of the called class.
   *
   * @return {string}
   */
  name() {
    return this.constructor.name;
  }
};
