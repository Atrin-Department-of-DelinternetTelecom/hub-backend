'use strict';

const _ = require('lodash');

module.exports = class {
  /**
   * List of available meta information.
   *
   * @type {Object}
   */
  metas = {};

  /**
   * Add new meta value.
   *
   * @param  {string|Object} key
   * @param  {any} value
   * @return {this}
   */
  withMeta(key, value = null) {
    if (typeof key === 'string') {
      this.metas[key] = value;
    } else {
      this.metas = { ...this.metas, ...key };
    }

    return this;
  }

  /**
   * Get  meta value for given key.
   *
   * @param  {string} key
   * @param  {any} defaultValue
   * @return {any}
   */
  meta(key = null, defaultValue = null) {
    return key ? _.get(this.metas, key, defaultValue) : this.metas;
  }
};
