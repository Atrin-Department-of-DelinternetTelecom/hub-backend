//@ts-check
'use strict';
const { LemonAddressMapping: Model } = require('@models').intranet;

const { ADDRESS } = require('@api/constants/address');
const { associateBy } = require('@api/utils/collections');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const ImportLemonAddresses = require('./actions/ImportLemonAddresses');

module.exports = class LemonAddressMapping extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),
      new Enum('type')
        .options(associateBy(Object.values(ADDRESS), (val) => val))
        .sortable()
        .filterable()
        .rules('required'),
      new Text('name').sortable().filterable().rules('required'),
      new Text('code').sortable().filterable().nullable(),
      new NumberField('lemon_id').sortable().filterable(),
    ];
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
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new ImportLemonAddresses().standalone()];
  }
};
