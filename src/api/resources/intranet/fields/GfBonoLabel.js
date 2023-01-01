//@ts-check
'use strict';
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');

module.exports = class GfBonoLabel extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {any[]}
   */
  fields(request) {
    return [
      new ID(),

      new TextField('Name')
        .help('exampl: name of the label')
        .sortable()
        .filterable()
        .required()
        .rules('required')
        .default(''),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
