'use strict';

const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfContractFeeChange extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid'),

      new NumberField('Contract', 'contractId').nullable().filterable(),

      new NumberField('From Fee Group', 'fromFeeGroupId')
        .nullable()
        .filterable(),

      new NumberField('To Fee Group', 'toFeeGroupId').nullable().filterable(),

      new DateTime('Executed Date', 'executedDate').exceptOnForms().nullable(),

      new DateTime('Prevision Date', 'previsionDate')
        .exceptOnForms()
        .nullable(),

      new BooleanField('Done')
        .swagger('type', 'number')
        .nullable()
        .filterable(),

      new BooleanField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
