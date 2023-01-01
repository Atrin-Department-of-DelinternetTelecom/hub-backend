'use strict';

const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const Textarea = require('@lib/crud/Fields/Textarea');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');
const BooleanField = require('@lib/crud/Fields/Boolean');
const Decimal = require('@lib/crud/Fields/Decimal');
const DateField = require('@lib/crud/Fields/Date');
const ID = require('@lib/crud/Fields/ID');

module.exports = class GfCellProviderFeeBonus extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return [
      new ID().sortable().filterable(),

      new UID(),

      new TextField('name').sortable().filterable(),

      new TextField('Provider Bonus Id', 'providerBonusId'),

      new TextField('Key Search', 'keySearch').nullable(),

      new Decimal('pvp', 'pvp').nullable().sortable().filterable(),

      new Decimal('Minutes').nullable().sortable().filterable(),

      new Decimal('gb', 'gb').nullable().sortable().filterable(),

      new Textarea('Description').nullable().sortable().filterable(),

      new TextField('Bonus Type', 'bonusType')
        .nullable()
        .sortable()
        .filterable(),

      new NumberField('Provider State', 'providerState')
        .nullable()
        .sortable()
        .filterable(),

      new TextField('TPV Code', 'tpvCode').nullable().sortable().filterable(),

      new NumberField('Proportional').nullable().sortable().filterable(),

      new NumberField('Provider Id', 'providerId')
        .nullable()
        .sortable()
        .filterable(),

      new NumberField('Auto Renewable', 'autoRenewable')
        .exceptOnForms()
        .virtual(
          function () {
            return this.providerXrefs && this.providerXrefs.length > 0
              ? this.providerXrefs.pop()?.autoRenewable
              : 0;
          },
          () => {},
        ),

      new BooleanField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateField('Creation Date', 'creationDate')
        .exceptOnForms()
        .nullable()
        .sortable()
        .filterable(),

      new DateField('Update Date', 'updateDate')
        .exceptOnForms()
        .nullable()
        .sortable()
        .filterable(),
    ];
  }
};
