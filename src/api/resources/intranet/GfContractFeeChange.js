'use strict';

const GfContractFeeChangeFields = require('./fields/GfContractFeeChange');
const models = require('@models');
const Resource = require('@lib/crud/Resource');

module.exports = class GfContractFeeChange extends Resource {
  /**
   * Determine that need to creation API.
   *
   * @type {Boolean}
   */
  configureCreateSwagger = false;

  /**
   * Determine that need to update API.
   *
   * @type {Boolean}
   */
  configureUpdateSwagger = false;

  /**
   * Determine that need to delete API.
   *
   * @type {Boolean}
   */
  configureDeleteSwagger = false;

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return new GfContractFeeChangeFields().fields(request);
  }

  model() {
    return models.intranet.GfContractFeeChange;
  }
};
