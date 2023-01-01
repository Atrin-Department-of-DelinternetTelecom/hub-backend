//@ts-check
'use strict';

const GfBonusContractXrefFields = require('./fields/GfBonusContractXref');
const { GfBonus } = require('@models').intranet;
const { GfBonusContractXref: Model } = require('@models').intranet;
const { GfContract } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfBonusContractXref extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: GfBonus,
      as: 'bonus',
    },
    {
      model: GfContract,
      as: 'contract',
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfBonusContractXrefFields().fields(request);
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
