//@ts-check
'use strict';
const Field = require('./../Field');
const helpers = require('@utils/helpers');

module.exports = class NumberField extends Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'number';

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
        : Number(input);
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

    return this.isNullable() && this.isNullValue(value) ? null : Number(value);
  }
};
