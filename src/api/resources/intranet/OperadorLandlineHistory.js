//@ts-check
'use strict';

const { ASSIGNABLE_HISTORY } = require('@api/constants/statuses');
const {
  OperadorLandlineHistory: OperadorLandlineHistoryModel,
} = require('@api/models/intranet/intranet_operador_landline_history');
const {
  OperadorLandline,
} = require('@api/models/intranet/intranet_operador_landline');
const { GfContract } = require('@models').intranet;
const { associateBy } = require('@api/utils/collections');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const DateTime = require('@lib/crud/Fields/DateTime');

module.exports = class OperadorLandlineHistory extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    { model: GfContract, required: false },
    { model: OperadorLandline, required: false },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),

      new Enum('state')
        .options(associateBy(Object.values(ASSIGNABLE_HISTORY), (val) => val))
        .sortable()
        .filterable(),

      new NumberField('gf_contract_id')
        .sequelizeNullable()
        .required()
        .sortable()
        .filterable()
        .rules('existsOnIntranet:GfContract'),

      new NumberField('operador_landline_id')
        .required()
        .sortable()
        .filterable()
        .rules('existsOnIntranet:OperadorLandline'),

      new Text('Note').nullable(),

      new NumberField('operator_id')
        .required()
        .sortable()
        .filterable()
        .rules('existsOnsystem:User'),

      new DateTime('created_at')
        .sortable()
        .filterable()
        .exceptOnForms()
        .nullable(),

      new DateTime('updated_at').exceptOnForms().nullable(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return OperadorLandlineHistoryModel;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [];
  }
};
