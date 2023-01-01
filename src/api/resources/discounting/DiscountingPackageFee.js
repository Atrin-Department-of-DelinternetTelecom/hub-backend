//@ts-check
'use strict';
const DiscountingPackageFeeFields = require('./fields/DiscountingPackageFee');
const { DiscountingPackageFee: Model } = require('@models').system;
const Resource = require('@lib/crud/Resource');

module.exports = class DiscountingPackageFee extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new DiscountingPackageFeeFields().fields(request);
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
