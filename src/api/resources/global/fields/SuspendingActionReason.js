//@ts-check
'use strict';

const ID = require('@lib/crud/Fields/ID');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
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

      new NumberField('Suspending Action Id')
        .filterable()
        .sortable()
        .rules('existsOnIntranet:SuspendingAction'),

      new NumberField('Suspending Reason Id')
        .filterable()
        .sortable()
        .rules('existsOnIntranet:SuspendingReason'),
    ];
  }
};
