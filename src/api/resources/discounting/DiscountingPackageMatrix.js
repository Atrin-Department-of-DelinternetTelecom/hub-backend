//@ts-check
'use strict';
const DiscountingPackageMatrixFields = require('./fields/DiscountingPackageMatrix');
const { DiscountingPackageMatrix: Model } = require('@models').system;
const Resource = require('@lib/crud/Resource');

module.exports = class DiscountingPackageMatrix extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new DiscountingPackageMatrixFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return Model;
  }
};
