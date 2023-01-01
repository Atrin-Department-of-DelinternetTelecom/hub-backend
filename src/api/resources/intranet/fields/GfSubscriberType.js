//@ts-check
'use strict';
const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfSubscriberType extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array}
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid'),

      new TextField('Name')
        .help('exampl: My Name')
        .required()
        .rules('required')
        .filterable()
        .sortable(),

      new NumberField('Aire Networks Code', 'aireNetworksCode')
        .default(0)
        .required(),

      new BooleanField('Need Business Name?', 'needBusinessName')
        .swagger('type', 'number')
        .default(0)
        .required(),

      new BooleanField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
