//@ts-check
'use strict';

const {
  ContractTagCategory: Model,
} = require('@api/models/intranet/intranet_contract_tag_category');
const ID = require('@lib/crud/Fields/ID');
const Resource = require('@lib/crud/Resource');
const Json = require('@lib/crud/Fields/Json');
const BooleanField = require('@lib/crud/Fields/Boolean');

module.exports = class ContractTagCategory extends Resource {
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
      new BooleanField('visible').default(false).sortable().filterable(),
    ];
  }

  /**
   * Get the resource model name.
   */
  model() {
    return Model;
  }
};
