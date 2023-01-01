//@ts-check
'use strict';
const { GfContract } = require('@models').intranet;
const { GfContractSectionStatus: Model } = require('@models').intranet;
const GfContractSectionStatusFields = require('./fields/GfContractSectionStatus');
const { GfSection } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfContractSectionStatus extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: GfContract,
      as: 'contract',
    },
    {
      model: GfSection,
      as: 'section',
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfContractSectionStatusFields().fields(request);
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
