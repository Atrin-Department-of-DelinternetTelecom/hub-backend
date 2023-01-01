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
const Revoke = require('./actions/Revoke');
const ArrayField = require('@lib/crud/Fields/Array');

module.exports = class GrantPermission extends Resource {
  /**
   * Determine that need to "update" API.
   *
   * @type {Boolean}
   */
  configureUpdateSwagger = false;

  /**
   * Determine that need to "update" API.
   *
   * @type {Boolean}
   */
  configureCreateSwagger = false;

  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    { model: system.Document, as: 'document' },
    { model: intranet.GfClient, as: 'client' },
    { model: system.GrantablePermission, as: 'permissions' },
    { model: system.User },
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
      new Text('authorizedName', 'authorizedName').sortable().filterable(),
      new Text('authorizedFiscalId', 'authorizedFiscalId')
        .sortable()
        .filterable(),
      new Text('description').filterable(),
      new NumberField('clientId', 'clientId').sortable().filterable(),
      new NumberField('docId', 'docId')
        .resolveUsing((value) => `del:${value}`)
        .exceptOnForms()
        .sortable()
        .filterable(),
      new NumberField('userId', 'userId')
        .exceptOnForms()
        .sortable()
        .filterable()
        .fillUsing((req, model, attribute) => {
          model.setDataValue(attribute, req.user.userId);
        }),
      new BooleanField('isRevoked', 'isRevoked')
        .exceptOnForms()
        .sortable()
        .filterable(),
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
    return system.GrantPermission;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new Apply(), new Revoke()];
  }
};
