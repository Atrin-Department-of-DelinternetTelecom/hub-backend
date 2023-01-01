//@ts-check
'use strict';
const DiscountingPackageTagFields = require('./fields/DiscountingPackageTag');
const { DiscountingPackageTag: Model } = require('@models').system;
const Resource = require('@lib/crud/Resource');

module.exports = class DiscountingPackageTag extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new DiscountingPackageTagFields().fields(request);
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
