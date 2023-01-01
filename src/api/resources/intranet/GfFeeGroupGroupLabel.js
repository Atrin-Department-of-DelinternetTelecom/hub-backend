//@ts-check
'use strict';
const GfFeeGroupGroupLabelFields = require('./fields/GfFeeGroupGroupLabel');
const { GfFeegroupsGroupLabel } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfFeeGroupGroupLabel extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfFeeGroupGroupLabelFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GfFeegroupsGroupLabel;
  }
};
