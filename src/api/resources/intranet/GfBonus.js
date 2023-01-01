//@ts-check
'use strict';
const GfBonusFields = require('./fields/GfBonus');
const { GfBonus: Model } = require('@models').intranet;
const GfBonusService = require('@service/intranet/Fee/GfBonusService');
const { GfFeeGroup } = require('@models').intranet;
const { GfSection } = require('@models').intranet;
const { GfBonoLabel } = require('@models').intranet;

const Resource = require('@lib/crud/Resource');

module.exports = class GfBonus extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {any[]}
   */
  fields(request) {
    return new GfBonusFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return Model;
  }

  /**
   * Dispatch saving event.
   *
   * @param {any} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async saved(request, model) {
    await GfBonusService.setFixValues(model);
    await GfBonusService.syncInvoice(model);
  }

  /**
   * Prepare resource for swager config.
   *
   * @return Object
   */
  indexQuery(req, query = {}) {
    query.include = [
      ...(query.include ?? []),
      {
        model: GfSection,
        as: 'section',
        required: req.hasFilter('section.code'),
        where: req.hasFilter('section.code')
          ? { code: req.filter('section.code')?.value }
          : {},
      },
    ];

    if (req.hasOrder('section.code')) {
      query.order.push([
        ['section', 'code', req.order('section.code').direction],
      ]);
    }

    return query;
  }

  /**
   * Prepare resource for swager config.
   *
   * @return Object
   */
  detailQuery(req, query = {}) {
    query.include = [
      ...(query.include ?? []),
      {
        model: GfFeeGroup,
        as: 'feeGroups',
        required: false,
      },
      {
        model: GfBonoLabel,
        as: 'labels',
        required: false,
      },
      {
        model: GfSection,
        as: 'section',
        required: false,
      },
    ];

    return query;
  }
};
