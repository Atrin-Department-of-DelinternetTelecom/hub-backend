//@ts-check
'use strict';
const DateTime = require('@lib/crud/Fields/DateTime');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const Text = require('@lib/crud/Fields/Text');
const Textarea = require('@lib/crud/Fields/Textarea');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfContractSectionStatus extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid'),

      new NumberField('Section Id', 'sectionId')
        .sortable()
        .filterable()
        .required()
        .creationRules('required')
        .rules('existsOnIntranet:GfSection'),

      new NumberField('Contract Id', 'contractId')
        .sortable()
        .filterable()
        .required()
        .creationRules('required')
        .rules('existsOnIntranet:GfContract'),

      new Enum('State')
        .sortable()
        .filterable()
        .required()
        .rules('required')
        .options({
          empty: 'empty',
          done: 'done',
          executed: 'executed',
          pending: 'pending',
          error: 'error',
          suspended: 'suspended',
          blocked: 'blocked',
        }),

      new Text('Pending State', 'pendingState')
        .sortable()
        .filterable()
        .nullable()
        .default(''),

      new Textarea('Last Error', 'lastError').nullable().default(''),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
