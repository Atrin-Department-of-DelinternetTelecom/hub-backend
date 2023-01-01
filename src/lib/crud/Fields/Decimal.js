//@ts-check
'use strict';
const Field = require('./Number');

module.exports = class Decimal extends Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'float';

  /**
   * Length of column.
   *
   * @type {integer}
   */
  #length = 2;

  /**
   * Length of points.
   *
   * @type {integer}
   */
  #precision = 2;

  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {string} name
   * @param  {string} attribute
   * @constructor
   */
  constructor(name, attribute = null) {
    super(name, attribute);
    this.default(0.0);
    this.sequelizeGet((attribute, model) => {
      return Number(model.getDataValue(attribute));
    });
  }

  /**
   * Set the real length.
   *
   * @param  {integer} length
   * @param  {integer} precision
   * @return {this}
   */
  length(length = 12, precision = 2) {
    this.precision(precision);
    this.#length = length;

    return this;
  }

  /**
   * Set the decimal length.
   *
   * @param  {integer} length
   * @return {this}
   */
  precision(precision = 2) {
    this.#precision = precision;

    return this;
  }

  /**
   * Resolve the given attribute from the given resource.
   *
   * @param  {any}  resource
   * @param  {string}  attribute
   * @return {any}
   */
  resolveAttribute(resource, attribute) {
    const value = super.resolveAttribute(resource, attribute);

    return typeof value === 'number'
      ? Number(value.toFixed(this.#precision))
      : value;
  }

  /**
   * Preapre field for json.
   *
   * @return {Object}
   */
  jsonSerialize() {
    return {
      ...super.jsonSerialize(),
      precision: this.#precision,
      length: this.#length,
    };
  }
};
