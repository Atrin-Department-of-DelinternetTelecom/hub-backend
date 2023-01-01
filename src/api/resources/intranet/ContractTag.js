//@ts-check
'use strict';

const {
  ContractTag: Model,
} = require('@api/models/intranet/intranet_contract_tag');
const ID = require('@lib/crud/Fields/ID');
const Resource = require('@lib/crud/Resource');
const Json = require('@lib/crud/Fields/Json');
const BooleanField = require('@lib/crud/Fields/Boolean');
const NumberField = require('@lib/crud/Fields/Number');
const {
  ContractTagCategory,
} = require('@api/models/intranet/intranet_contract_tag_category');

module.exports = class ContractTag extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [{ model: ContractTagCategory }];

  /**
   * Get the list of fields.
   */
  fields() {
    return [
      new ID(),
      new Json('name')
        .default({ en: null, es: null, ca: null })
        .sortable()
        .filterable(),
      new BooleanField('comment_required')
        .default(false)
        .sortable()
        .filterable(),
      new BooleanField('visible').default(false).sortable().filterable(),
      new NumberField('contract_tag_category_id')
        .rules('existsOnIntranet:ContractTagCategory')
        .sortable()
        .filterable(),
    ];
  }

  /**
   * Get the resource model name.
   */
  model() {
    return Model;
  }
};
