//@ts-check
'use strict';

const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const { system, intranet } = require('@models');
const Apply = require('./actions/Apply');

module.exports = class ChangeBankNumber extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    { model: system.Document },
    { model: system.User },
    { model: intranet.GfClient, as: 'client' },
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
      new Text('iban').sortable().filterable(),
      new Text('bic').sortable().filterable(),
      new Text('bank').sortable().filterable(),
      new NumberField('gf_client_id').sortable().filterable(),
      new NumberField('doc_id')
        .resolveUsing((value) => `del:${value}`)
        .exceptOnForms()
        .sortable()
        .filterable(),
      new NumberField('user_id')
        .exceptOnForms()
        .sortable()
        .filterable()
        .fillUsing((req, model, attribute) => {
          model.setDataValue(attribute, req.user.userId);
        }),
      new BooleanField('done').exceptOnForms().sortable().filterable(),
      new DateTime('created_at').exceptOnForms(),
      new DateTime('updated_at').exceptOnForms(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.ChangeBankNumber;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new Apply()];
  }
};
