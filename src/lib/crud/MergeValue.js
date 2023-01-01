'use strict';

module.exports = class MergeValue {
  /**
   * Merge items.
   *
   * @type {Array}
   */
  #data = [];

  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {Array} data
   * @constructor
   */
  constructor(data = []) {
    this.#data = this.prepareData(data);
  }

  /**
   * Preapare data.
   *
   * @param  {Array}  items
   * @return {this}
   */
  prepareData(items = []) {
    this.#data = items;

    return this;
  }

  /**
   * Flat map data.
   *
   * @return {array}
   */
  get flatten() {
    const callback = (data, item) => {
      if (item instanceof MergeValue) {
        return [...data, item.flatten];
      }

      if (Array.isArray(item)) {
        return [...data, ...item];
      }

      data.push(item);

      return data;
    };

    return this.#data.reduce(callback, []);
  }
};
