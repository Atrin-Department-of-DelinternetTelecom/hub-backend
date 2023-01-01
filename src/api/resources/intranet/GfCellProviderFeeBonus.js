'use strict';

const GfCellProviderFeeBonusFields = require('./fields/GfCellProviderFeeBonus');
const models = require('@models');
const Resource = require('@lib/crud/Resource');
const { AireAdditionalBono } = require('@api/service/intranet/AireService');

module.exports = class GfCellProviderFeeBonus extends Resource {
  /**
   * The column(s) used to "group by" the "index" query.
   *
   * @type {string|Array|null}
   */
  groupBy = 'tpvCode';

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return new GfCellProviderFeeBonusFields().fields(request);
  }

  model() {
    return models.intranet.GfCellProviderFeeBonus;
  }

  /**
   * Prepare resource for swager config.
   *
   * @return Object
   */
  async indexQuery(req, query = {}) {
    if (req.hasFilter('tarifa')) {
      const tarifas =
        await AireAdditionalBono.findAllAndIgnoreIncompatibleError({
          tarifa: req.filter('tarifa').value,
          tarifa_basica: 'N',
        });

      query.where = {
        ...(query.where ?? {}),
        providerBonusId: tarifas.map((tarifa) => tarifa.id),
      };
    }

    query.include = [
      ...(query.include ?? []),
      {
        model: models.intranet.GfCellProviderFeeBonusXref,
        as: 'providerXrefs',
        required: false,
      },
    ];

    return query;
  }
};
