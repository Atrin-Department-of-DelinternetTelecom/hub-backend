//@ts-check
'use strict';
const GfFeeGroupLabelFields = require('./fields/GfFeeGroupLabel');
const { GfFeegroupsLabel } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfFeeGroupLabel extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {any[]}
   */
  fields(request) {
    return new GfFeeGroupLabelFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GfFeegroupsLabel;
  }
};
