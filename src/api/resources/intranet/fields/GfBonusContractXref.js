//@ts-check
'use strict';
const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfBonusContractXref extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid').sequelizeSet((value, attribute, model) => {
        model.setDataValue(attribute, typeof value === 'number' ? value : -1);
      }),

      new NumberField('Bonus', 'bonoId')
        .filterable()
        .sortable()
        .required()
        .rules('required', 'existsOnIntranet:GfBonus'),

      new NumberField('Contract', 'contractId')
        .filterable()
        .sortable()
        .required()
        .rules('required', 'existsOnIntranet:GfContract'),

      new NumberField('User', 'userId')
        .nullable()
        .exceptOnForms()
        .fillUsing((req, model, attribute) => {
          if (!model.userId) {
            model.set('userId', req.user.userId);
          }
        }),

      new BooleanField('Auto Renew', 'autoRenew')
        .filterable()
        .sortable()
        .default(false),

      new BooleanField('Prorotable').filterable().sortable().default(false),
      new BooleanField('Promotional').filterable().sortable().default(false),

      new Enum('State')
        .filterable()
        .sortable()
        .default('pendingActivation')
        .options({
          pendingActivation: 'Pending Activation',
          pendingDeactivation: 'Pending Deactivation',
          done: 'Done',
        }),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms()
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(attribute, typeof value === 'number' ? value : 1);
        }),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
