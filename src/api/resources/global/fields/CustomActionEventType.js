//@ts-check
'use strict';

const DateField = require('@lib/crud/Fields/DateTime');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const JsonField = require('@lib/crud/Fields/Json');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const uuid = require('uuid');
const ArrayField = require('@lib/crud/Fields/Array');
const BooleanField = require('@lib/crud/Fields/Boolean');

module.exports = class CustomActionEventTypeFields extends ResolvesFields {
  /**
   * Determine that need to creation API.
   *
   * @type {Boolean}
   */
  configureCreateSwagger = false;

  /**
   * Determine that need to update API.
   *
   * @type {Boolean}
   */
  configureUpdateSwagger = false;

  /**
   * Determine that need to delete API.
   *
   * @type {Boolean}
   */
  configureDeleteSwagger = false;

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),
      new JsonField('presentation')
        .required()
        .rules('required')
        .sortable()
        .filterable(),
      new Enum('action').default('Update').sortable().filterable().options({
        update: 'UPDATE',
        create: 'CREATE',
        delete: 'DELETE',
      }),
      new JsonField('keys').default({}).sortable().filterable().required(),
      new JsonField('rootJoinSelector').default({}).sortable().filterable(),
      new TextField('resourceType')
        .sortable()
        .filterable()
        .required()
        .rules('required'),
      new BooleanField('enable').sortable().default(true),
    ];
  }
};
