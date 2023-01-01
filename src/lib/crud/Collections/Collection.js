'use strict';

module.exports = class Collection {
  /**
   * List of items.
   *
   * @type {Array}
   */
  items = [];

  constructor(items = []) {
    this.items = items;
  }

  /**
   * Get items.
   *
   * @return {array}
   */
  all() {
    return this.items;
  }

  /**
   * Get items.
   *
   * @param {function} callback
   * @return {this}
   */
  map(callback) {
    return new this.constructor(this.items.map(callback));
  }
};
