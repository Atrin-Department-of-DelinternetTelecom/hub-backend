//@ts-check
'use strict';
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfBonusFeeGroupXref extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid').sequelizeSet((value, attribute, model) => {
        model.setDataValue(attribute, typeof value === 'number' ? value : -1);
      }),

      new NumberField('Bonus', 'bonusId').required().rules('required'),
      new NumberField('Fee Group', 'feeGroupId').required().rules('required'),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms()
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(attribute, typeof value === 'number' ? value : 1);
        }),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
