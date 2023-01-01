//@ts-check
'use strict';
const { GfBonus } = require('@models').intranet;
const { GfBonusHistory: Model } = require('@models').intranet;
const GfBonusHistoryFields = require('./fields/GfBonusHistory');
const { GfContract } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfBonusHistory extends Resource {
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
      model: GfBonus,
      as: 'bonus',
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfBonusHistoryFields().fields(request);
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
