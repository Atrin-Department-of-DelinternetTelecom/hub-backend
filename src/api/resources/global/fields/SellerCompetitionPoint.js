//@ts-check
'use strict';

const ID = require('@lib/crud/Fields/ID');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const NumberField = require('@lib/crud/Fields/Number');
const Enum = require('@lib/crud/Fields/Enum');
const Select = require('@lib/crud/Fields/Select');

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

      new Enum('group')
        .filterable()
        .sortable()
        .options({
          fee: 'Product', // point of fee groups
          process: 'Process', // point of operator processes
        })
        .help('fee,process')
        .required()
        .rules('required', 'in:fee,process'),

      new Select('Item').filterable().sortable().options({
        proccess_callme: 'Callme',
        proccess_orders: 'Web Orders',
        proccess_landing_page: 'Landing Pages',
      }),

      new NumberField('point')
        .default(1)
        .required()
        .rules('required')
        .filterable()
        .sortable(),
    ];
  }
};
