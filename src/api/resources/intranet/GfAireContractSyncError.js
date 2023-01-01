//@ts-check
'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const { intranet } = require('@models');
const FixMissingAireCodes = require('./actions/FixMissingAireCodes');

module.exports = class GfAireContractSyncError extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: intranet.GfAireContract,
      include: [{ model: intranet.GfContract, required: false }],
    },
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
      new Text('code').sortable().filterable(),
      new NumberField('number').sortable().filterable(),
      new NumberField('aireId', 'aireId').sortable().filterable(),
      new Text('description').sortable().filterable(),

      new DateTime('Creation Date', 'creationDate')
        .exceptOnForms()
        .sortable()
        .filterable(),

      new DateTime('Update Date', 'updateDate')
        .exceptOnForms()
        .sortable()
        .filterable(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return intranet.GfAireContractSyncError;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new FixMissingAireCodes().standalone()];
  }
};
