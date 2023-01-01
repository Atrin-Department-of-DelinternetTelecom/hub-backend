//@ts-check
'use strict';
const DateField = require('@lib/crud/Fields/Date');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfBonusScheduled extends ResolvesFields {
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

      new NumberField('Bonus Id', 'bonoId')
        .sortable()
        .filterable()
        .required()
        .rules('required', 'existsOnIntranet:GfBonus'),

      new NumberField('Contract Id', 'contractId')
        .sortable()
        .filterable()
        .required()
        .rules('required', 'existsOnIntranet:GfContract'),

      new NumberField('Bonus Contract Xref Id', 'bonusContractXrefId')
        .exceptOnForms()
        .nullable()
        .default(null),

      new NumberField('Executed Id', 'executedId')
        .exceptOnForms()
        .nullable()
        .default(null),

      new DateField('Init Date', 'initDate')
        .exceptOnForms()
        .nullable()
        .default(null),

      new DateField('End Date', 'endDate')
        .exceptOnForms()
        .nullable()
        .default(null),

      new TextField('Key Group', 'keyGroup')
        .exceptOnForms()
        .nullable()
        .default(null),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
