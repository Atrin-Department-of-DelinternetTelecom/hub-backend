//@ts-check
'use strict';

const SellerCompetitionPointFields = require('./fields/SellerCompetitionPoint');
const Resource = require('@lib/crud/Resource');
const { system, intranet } = require('@models');
const {
  destoryGfContractsId,
} = require('@api/service/intranet/GfContractService');

module.exports = class SellerCompetitionPoint extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new SellerCompetitionPointFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.SellerCompetitionPoint;
  }
};
