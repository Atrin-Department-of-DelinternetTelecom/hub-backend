//@ts-check
'use strict';
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfBonoLabelXref extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {any[]}
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid'),

      new NumberField('Bono Label', 'labelId')
        .required()
        .rules('required')
        .filterable()
        .sortable(),

      new NumberField('Bono', 'bonoId')
        .required()
        .rules('required')
        .filterable()
        .sortable(),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
