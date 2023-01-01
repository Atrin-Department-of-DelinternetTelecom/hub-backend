//@ts-check
'use strict';

const {
  LemonLine: LemonLineModel,
} = require('@api/models/intranet/intranet_lemon_line');
const { GfContract } = require('@models').intranet;
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const RevisionLemonLines = require('./actions/RevisionLemonLines');
const BooleanField = require('@lib/crud/Fields/Boolean');
const Json = require('@lib/crud/Fields/Json');
const RevisionLemonLinesLocal = require('./actions/RevisionLemonLinesLocal');

module.exports = class LemonLine extends Resource {
  /**
   * Determine that need to "create" API.
   *
   * @type {Boolean}
   */
  configureCreateSwagger = false;

  /**
   * Determine that need to "update" API.
   *
   * @type {Boolean}
   */
  configureUpdateSwagger = false;

  /**
   * Determine that need to "delete" API.
   *
   * @type {Boolean}
   */
  configureDeleteSwagger = false;

  /**
   * Eager loaded relation ships.
   */
  include = [
    {
      model: GfContract,
      attributes: ['id', 'reference', 'clientId'],
      required: false,
    },
  ];

  /**
   * Get the list of fields.
   */
  fields() {
    return [
      new ID(),
      new Text('number').sortable().filterable(),
      new Text('fiscal_id').sortable().filterable(),
      new NumberField('gf_contract_id').sortable().filterable(),
      new BooleanField('active').sortable().filterable(),
      new BooleanField('portable').sortable().filterable(),
      new Text('creation_date').sortable().filterable(),
      new Text('termination_date').sortable().filterable(),
      new Json('data').nullable(),
      new Json('package').nullable(),
    ];
  }

  /**
   * Get the resource model name.
   */
  model() {
    return LemonLineModel;
  }

  /**
   * Get the list of the resource actions.
   */
  actions() {
    return [
      new RevisionLemonLines().standalone(),
      new RevisionLemonLinesLocal().standalone(),
    ];
  }
};
