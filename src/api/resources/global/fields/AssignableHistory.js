//@ts-check
'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const { ASSIGNABLE_HISTORY } = require('@api/constants/statuses');

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

      new Enum('Action Type')
        .sortable()
        .filterable()
        .required()
        .rules('required', 'in:' + Object.values(ASSIGNABLE_HISTORY).join(','))
        .options({
          [ASSIGNABLE_HISTORY.REALEASED]: 'Released',
          [ASSIGNABLE_HISTORY.ASSIGNED]: 'Assigned',
          [ASSIGNABLE_HISTORY.RESERVED]: 'Reserved',
        })
        .default(ASSIGNABLE_HISTORY.ASSIGNED),

      new NumberField('Contract Id')
        .sequelizeNullable()
        .required()
        .sortable()
        .filterable()
        .rules('existsOnIntranet:GfContract'),

      new NumberField('Assignable Id')
        .required()
        .sortable()
        .filterable()
        .rules('existsOnsystem:Assignable'),

      new TextField('Note').nullable(),

      new NumberField('Operator Id')
        .required()
        .sortable()
        .filterable()
        .rules('existsOnsystem:User'),

      new DateTime('Creation Date', 'created_at')
        .sortable()
        .filterable()
        .exceptOnForms()
        .nullable(),

      new DateTime('Update Date', 'updated_at').exceptOnForms().nullable(),
    ];
  }
};
