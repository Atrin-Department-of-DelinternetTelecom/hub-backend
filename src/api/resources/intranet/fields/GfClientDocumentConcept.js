'use strict';

const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfClientDocumentConcept extends ResolvesFields {
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

      new TextField('Name').help('exampl: SEPA').required(),

      new BooleanField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'upudateDate').exceptOnForms().nullable(),
    ];
  }
};
