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

module.exports = class ActionEvent extends ResolvesFields {
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

      new TextField('Batch Id')
        .sortable()
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(
            attribute,
            uuid.validate(value) ? value : uuid.v4(),
          );
        }),

      new TextField('Action')
        .required()
        .rules('required')
        .sortable()
        .filterable(),

      new TextField('Resource Type').sortable().filterable(),
      new NumberField('Resource Id').sortable().filterable(),

      new JsonField('Payload').sequelize('set', function (value, key) {
        delete value?.password;

        return this.setDataValue(key, JSON.stringify(value));
      }),

      new JsonField('Original'),

      new JsonField('Changes'),

      new JsonField('Fields'),

      new NumberField('User Id', 'userId')
        .nullable()
        .default(0)
        .sortable()
        .filterable(),

      new JsonField('Exception').hideOnIndex(),

      new Enum('Status').default('pending').sortable().filterable().options({
        pending: 'Pending',
        failed: 'Failed',
        running: 'Running',
        finished: 'Finished',
      }),

      new DateField('Created At', 'created_at')
        .sortable()
        .filterable()
        .nullable(),

      new DateField('Updated At', 'updated_at')
        .sortable()
        .filterable()
        .nullable(),
    ];
  }
};
