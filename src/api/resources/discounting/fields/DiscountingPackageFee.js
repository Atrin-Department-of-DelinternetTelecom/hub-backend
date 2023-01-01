//@ts-check
'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const { Op } = require('sequelize');
const ArrayField = require('@lib/crud/Fields/Array');
const NumberField = require('@lib/crud/Fields/Number');

module.exports = class extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),

      new TextField('Type')
        .default('discount')
        .required()
        .rules('required', 'in:fix,percentage'),

      new NumberField('Amount').default(0).required(),

      new NumberField('Gf Fee Group Id').filterable().sortable(),
      new NumberField('Discounting Package Id').filterable().sortable(),
    ];
  }
};
