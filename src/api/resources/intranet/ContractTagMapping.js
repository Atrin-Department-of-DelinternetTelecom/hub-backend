//@ts-check
'use strict';

const { ContractTag } = require('@api/models/intranet/intranet_contract_tag');
const {
  ContractTagMapping: Model,
} = require('@api/models/intranet/intranet_contract_tag_mapping');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const { GfContract } = require('@models').intranet;

module.exports = class ContractTagMapping extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [{ model: ContractTag }, { model: GfContract }];

  /**
   * Get the list of fields.
   */
  fields() {
    return [
      new ID(),
      new NumberField('contract_tag_id')
        .rules('existsOnIntranet:ContractTag')
        .sortable()
        .filterable(),
      new NumberField('gf_contract_id')
        .rules('existsOnIntranet:GfContract')
        .sortable()
        .filterable(),
      new Text('comment').nullable().sortable().filterable(),
    ];
  }

  /**
   * Get the resource model name.
   */
  model() {
    return Model;
  }
};
