//@ts-check
'use strict';
const { GfFeeGroup } = require('@models').intranet;
const { GfFeegroupsLabel } = require('@models').intranet;
const { GfFeegroupsLabelsXref } = require('@models').intranet;
const GfFeeGroupLabelXrefFields = require('./fields/GfFeeGroupLabelXref');
const Resource = require('@lib/crud/Resource');

module.exports = class GfFeeGroupLabelXref extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: GfFeegroupsLabel,
      as: 'label',
    },
    {
      model: GfFeeGroup,
      as: 'feeGroup',
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfFeeGroupLabelXrefFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GfFeegroupsLabelsXref;
  }
};
