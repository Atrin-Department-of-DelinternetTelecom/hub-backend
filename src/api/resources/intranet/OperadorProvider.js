//@ts-check
'use strict';

const {
  OperadorProvider: OperadorProviderModel,
} = require('@api/models/intranet/intranet_operador_provider');
const ID = require('@lib/crud/Fields/ID');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const ImportProviders = require('./actions/ImportProviders');

module.exports = class OperadorProvider extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),
      new Text('name').sortable().filterable().required().rules('required'),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return OperadorProviderModel;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new ImportProviders().standalone()];
  }
};
