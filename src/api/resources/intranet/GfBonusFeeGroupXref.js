//@ts-check
'use strict';

const GfBonusFeeGroupXrefFields = require('./fields/GfBonusFeeGroupXref');
const { GfBonus } = require('@models').intranet;
const { GfBonusFeegroupsXref } = require('@models').intranet;
const { GfFeeGroup } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfBonusFeeGroupXref extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfBonusFeeGroupXrefFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GfBonusFeegroupsXref;
  }

  /**
   * Prepare resource for swager config.
   *
   * @return Object
   */
  indexQuery(req, query = {}) {
    return this.mergeIncludes(query);
  }

  /**
   * Prepare resource for swager config.
   *
   * @return Object
   */
  detailQuery(req, query = {}) {
    return this.mergeIncludes(query);
  }

  mergeIncludes(query) {
    query.include = [
      ...(query.include ?? []),
      {
        model: GfFeeGroup,
        as: 'feeGroup',
        required: false,
      },
      {
        model: GfBonus,
        as: 'gf_bonus',
        required: false,
      },
    ];

    return query;
  }
};
