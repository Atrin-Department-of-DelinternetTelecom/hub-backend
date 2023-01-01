//@ts-check
'use strict';
const Field = require('./../Field');
const helpers = require('@utils/helpers');

module.exports = class BooleanField extends Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'boolean';

  /**
   * Value of the truth.
   *
   * @type {any}
   */
  #trueValue = true;

  /**
   * Value of the falsy.
   *
   * @type {any}
   */
  #falseValue = false;

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   *
   * @param  {object}  request
   * @param  {object}  model
   * @param  {string}  attribute
   * @return {function|void}
   */
  fillAttributeFromRequest(request, model, attribute) {
    if (!request.has(attribute)) return;

    const value = helpers.with(request.input(attribute), (input) => {
      return this.isNullable() && this.isNullValue(input)
        ? null
        : Boolean(input);
    });

    return attribute.includes('->')
      ? this.setJsonAttribute(value, model, attribute)
      : this.setAttribute(value, model, attribute);
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

    return this.isNullable() && this.isNullValue(value)
      ? null
      : value == this.#trueValue;
  }

  /**
   * Set the true value.
   *
   * @param  {any} trueValue
   * @return {this}
   */
  trueValue(trueValue = true) {
    this.#trueValue = trueValue;

    return this;
  }

  /**
   * Set the false value.
   *
   * @param  {any} falseValue
   * @return {this}
   */
  falseValue(falseValue = false) {
    this.#falseValue = falseValue;

    return this;
  }

  /**
   * Preapre field for json.
   *
   * @return {Object}
   */
  jsonSerialize() {
    return {
      ...super.jsonSerialize(),
      trueValue: this.#trueValue,
      falseValue: this.#falseValue,
    };
  }
};
