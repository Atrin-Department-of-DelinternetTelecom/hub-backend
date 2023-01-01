//@ts-check
'use strict';

const Field = require('./../Field');

module.exports = class ArrayField extends Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'array';

  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {string} name
   * @param  {string=} attribute
   * @constructor
   */
  constructor(name, attribute = null) {
    super(name, attribute);
    this.default([]);
    this.typeOf('number');

    const field = this;
    this.sequelize('get', function () {
      return field.fromJson(this.getDataValue(field.attribute) ?? []);
    });
    this.sequelize('set', function (value) {
      this.setDataValue(field.attribute, field.toJson(value));
    });
  }

  /**
   * Set type of the array items for swagger.
   *
   * @param {any} typeOf
   * @return {this}
   */
  typeOf(items) {
    this.swagger('items', typeof items === 'string' ? { type: items } : items);

    return this;
  }

  /**
   * Parse the value from json.
   *
   * @param {string|object} value
   * @return {Array[]}
   */
  fromJson(value) {
    try {
      value = JSON.parse(value);
    } catch (e) {
      value = [];
    }

    return typeof value === 'object' ? Object.values(value) : [];
  }

  /**
   * Convert the value to json.
   *
   * @param {object} value
   * @return {string}
   */
  toJson(value) {
    if (typeof value === 'object') {
      value = Object.values(value);
    }

    // @ts-ignore
    return JSON.stringify(Array.isArray(value) ? value : []);
  }
};
