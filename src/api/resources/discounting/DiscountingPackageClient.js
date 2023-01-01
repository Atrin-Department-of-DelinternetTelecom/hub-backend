//@ts-check
'use strict';
const DiscountingPackageClientFields = require('./fields/DiscountingPackageClient');
const { DiscountingPackageClient: Model } = require('@models').system;
const Resource = require('@lib/crud/Resource');

module.exports = class DiscountingPackageClient extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new DiscountingPackageClientFields().fields(request);
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
