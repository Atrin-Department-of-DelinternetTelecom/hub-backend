//@ts-check
('use strict');

const DateField = require('@lib/crud/Fields/DateTime');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const JsonField = require('@lib/crud/Fields/Json');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const uuid = require('uuid');

module.exports = class CustomActionEventFields extends ResolvesFields {
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
      new JsonField('Payload'),

      new JsonField('Original'),

      new JsonField('Changes'),

      new NumberField('User Id', 'userId')
        .nullable()
        .default(0)
        .sortable()
        .filterable(),
      new NumberField('Client Id', 'clientId')
        .nullable()
        .default(0)
        .sortable()
        .filterable(),
      new NumberField('Action Type Id', 'typeId')
        .nullable()
        .default(0)
        .sortable()
        .filterable(),
      new NumberField('Action Event Id', 'eventId')
        .nullable()
        .default(0)
        .sortable()
        .filterable(),
      new NumberField('Resource Id', 'resourceId')
        .nullable()
        .default(0)
        .sortable()
        .filterable(),
      new NumberField('Resource Type', 'resourceType')
        .nullable()
        .default(0)
        .sortable()
        .filterable(),
      new JsonField('rootJoinData', 'rootJoinData')
        .nullable()
        .default({})
        .sortable()
        .filterable(),
    ];
  }
};
