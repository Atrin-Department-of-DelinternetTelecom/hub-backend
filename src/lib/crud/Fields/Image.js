'use strict';

const Field = require('./File');

module.exports = class Image extends Field {
  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {string} name
   * @param  {string} attribute
   * @constructor
   */
  constructor(name, attribute = null) {
    super(name, attribute);
    this.swagger('x-mimetype', 'application/image');
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   *
   * @param {Object}  request
   * @param {Object}  model
   * @param  {string}  attribute
   * @return {any}
   */
  fillAttributeFromRequest(req, model, attribute) {
    return async function () {
      if (!req.hasFile(attribute)) return;
      console.log(req.files);
      // const value = helpers.with(req.input(attribute), (input) => {
      // 	return this.isNullable() && this.isNullValue(input) ? null : input;
      // });

      // return attribute.includes('->')
      // 	? this.setJsonAttribute(value, model, attribute)
      // 	: this.setAttribute(value, model, attribute);
    };
  }
};
