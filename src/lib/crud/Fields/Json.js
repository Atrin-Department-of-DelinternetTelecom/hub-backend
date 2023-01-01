//@ts-check
'use strict';

const Field = require('./../Field');

module.exports = class Json extends Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'object';

  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {string} name
   * @param  {string} attribute
   * @constructor
   */
  constructor(name, attribute = null) {
    super(name, attribute);
    this.default({});

    const field = this;
    this.sequelize('type', 'long');
    this.sequelize('get', function () {
      return field.fromJson(this.getDataValue(field.attribute) ?? []);
    });
    this.sequelize('set', function (value) {
      this.setDataValue(field.attribute, field.toJson(value));
    });
  }

  /**
   * Parse the value from json.
   *
   * @param {string|object} value
   * @return {Object}
   */
  fromJson(value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return {};
    }
  }

  /**
   * Convert the value to json.
   *
   * @param {string|object} value
   * @return {string}
   */
  toJson(value) {
    return JSON.stringify(value);
  }
};
