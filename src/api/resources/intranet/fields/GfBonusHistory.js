//@ts-check
'use strict';
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfBonusHistory extends ResolvesFields {
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

      new NumberField('Contract', 'contractId')
        .sortable()
        .filterable()
        .required()
        .creationRules('required')
        .rules('existsOnIntranet:GfContract'),

      new NumberField('Bonus', 'bonoId')
        .sortable()
        .filterable()
        .required()
        .creationRules('required')
        .rules('existsOnIntranet:GfBonus'),

      new NumberField('XREF', 'xrefId')
        .sortable()
        .filterable()
        .required()
        .creationRules('required')
        .rules('existsOnIntranet:GfBonusContractXref'),

      new NumberField('User', 'userId').sortable().filterable().nullable(),

      new DateTime('Init Date', 'initDate').nullable().default(''),

      new DateTime('End Date', 'endDate').nullable(),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
