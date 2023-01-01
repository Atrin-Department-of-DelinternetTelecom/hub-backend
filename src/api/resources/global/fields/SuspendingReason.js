//@ts-check
'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const Json = require('@lib/crud/Fields/Json');
const Select = require('@lib/crud/Fields/Select');
const { SERVICE } = require('@api/constants/contracts');
const BooleanField = require('@lib/crud/Fields/Boolean');

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

      new Json('Label')
        .required()
        .rules('required', 'object')
        .filterable()
        .sortable()
        .default({
          en: 'Reason EN',
          es: 'Reason ES',
          ca: 'Reason CA',
        }),

      new Select('Service')
        .default('*')
        .rules('required')
        .required()
        .sortable()
        .filterable()
        .options({
          '*': 'All',
          CELL: SERVICE.CELL,
          FIX: SERVICE.FIX,
          INTERNET: SERVICE.INTERNET,
          TV: SERVICE.TV,
        }),

      new BooleanField('active').filterable().sortable().default(false),
      new DateTime('Creation Date', 'created_at').exceptOnForms().nullable(),
      new DateTime('Update Date', 'updated_at').exceptOnForms().nullable(),
    ];
  }
};
