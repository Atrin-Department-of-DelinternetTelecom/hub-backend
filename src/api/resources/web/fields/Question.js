//@ts-check
'use strict';

const JsonField = require('@lib/crud/Fields/Json');
const BooleanField = require('@lib/crud/Fields/Boolean');
const Enum = require('@lib/crud/Fields/Enum');
const helpers = require('@utils/helpers');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');

module.exports = class QuestionFields extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return array
   */
  fields(request) {
    return [
      new ID(),

      new BooleanField('Active')
        .default(false)
        .sortable()
        .filterable()
        .sequelize('get', function (attribute) {
          return helpers.isTruthy(this.getDataValue(attribute)) ? true : false;
        }),

      new Enum('Group').default('*').sortable().filterable().options({
        general: 'General questions',
        fix: 'Fixed Telephone',
        cell: 'Mobile Telephony',
        net: 'Fiber optic',
        radio: 'Radio link',
        tv: 'Digital Television',
        support: 'Support',
        router: 'Router',
        altercom: 'Fusió amb Altercom',
        business: 'Business',
      }),

      new JsonField('Title')
        .required(request?.isResourceCreateRequest())
        .creationRules('required')
        .sortable()
        .filterable(),

      new JsonField('Body').required(request?.isResourceCreateRequest()),

      new NumberField('Order').default(Date.now()).sortable().filterable(),
    ];
  }
};
