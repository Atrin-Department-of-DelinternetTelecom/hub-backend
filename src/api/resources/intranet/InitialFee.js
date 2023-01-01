//@ts-check
'use strict';

const {
  InitialFee: Model,
} = require('@api/models/intranet/intranet_initial_fee');
const ID = require('@lib/crud/Fields/ID');
const Resource = require('@lib/crud/Resource');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const { GfFee } = require('@api/models/intranet/intranet_gf_fees');
const { Op } = require('sequelize');

module.exports = class InitialFee extends Resource {
  include = [{ model: GfFee, required: false, attributes: ['id', 'name'] }];

  /**
   * Get the list of fields.
   */
  fields() {
    return [
      new ID(),
      new Text('name').required().sortable().filterable().rules('required'),
      new NumberField('price')
        .required()
        .sortable()
        .filterable()
        .rules('required'),
    ];
  }

  /**
   * Get the resource model name.
   */
  model() {
    return Model;
  }

  /**
   * Prepare resource for swager config.
   *
   * @return Object
   */
  indexQuery(req, query = {}) {
    query.include[0].required = req.hasFilter('fee');
    if (req.hasFilter('fee')) {
      query.include[0].where = { id: req.filter('fee').value };
    }

    return query;
  }

  possibleFilters() {
    return [...super.possibleFilters(), 'fee'];
  }
};
