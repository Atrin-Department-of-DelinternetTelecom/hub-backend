//@ts-check
'use strict';
const moment = require('moment');

const Date = require('@lib/crud/Fields/Date');
const DateTime = require('@lib/crud/Fields/DateTime');
const Decimal = require('@lib/crud/Fields/Decimal');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const models = require('@models');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');
const { DISCOUNT_SCHEDULED } = require('@api/constants/statuses');
const { TYPE, DISCOUNT_TYPE } = require('@api/constants/discount');

module.exports = class GfDiscountScheduled extends ResolvesFields {
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

      new NumberField('Contract Id', 'contractId')
        .sortable()
        .filterable()
        .required()
        .default(0)
        .creationRules('required', async (value, attribute, fail) => {
          const Model = models.intranet.GfContract;

          if ((await Model.findByPk(value)) === null) {
            fail(`${Model.name} by id:${value} not found.`);
          }
        })
        .updateRules(async (value, attribute, fail) => {
          const discount = await request.findModelOrFail();

          if (Number(value) !== Number(discount.contractId)) {
            fail(`can not update contractId.`);
          }
        }),

      new NumberField('Matrix', 'matrixId')
        .sortable()
        .filterable()
        .nullable()
        .exceptOnForms(),

      new NumberField('Executed', 'executedId')
        .sortable()
        .filterable()
        .nullable()
        .exceptOnForms(),

      new NumberField('Permanent Parent', 'permanentParentId')
        .nullable()
        .sortable()
        .filterable()
        .exceptOnForms(),

      new Date('Date')
        .sortable()
        .filterable()
        .required()
        .creationRules('required')
        .rules('dateiso')
        .sequelizeGet((attribute, model) => {
          return moment(model.getDataValue(attribute)).format('YYYY-MM-DD');
        }),

      new TextField('Description')
        .required()
        .creationRules('required')
        .sequelizeNullable()
        .default(''),

      new NumberField('Permanent')
        .sortable()
        .filterable()
        .default(false)
        .resolveUsing((value) => (value ? 1 : 0))
        .sequelizeGet((attribute, model) => {
          return Boolean(model.getDataValue(attribute));
        }),

      new Decimal('Discount')
        .length(11, 2)
        .default(0.0)
        .sortable()
        .filterable()
        .creationRules('required')
        .rules((value, attribute, fail) => {
          if (
            request.input('discountType') === DISCOUNT_TYPE.PERCENTAGE &&
            parseFloat(value) > 100
          ) {
            fail('Discount percentage should be less than 100.');
          }
        })
        .required()
        .sequelizeGet((attribute, model) => {
          return Number(model.getDataValue(attribute));
        }),

      new Enum('Discount Type', 'discountType')
        .default(DISCOUNT_TYPE.FIX)
        .required()
        .sortable()
        .filterable()
        .creationRules('required')
        .options({
          [DISCOUNT_TYPE.FIX]: 'Fix Value',
          [DISCOUNT_TYPE.PERCENTAGE]: 'Percentage Value',
        }),

      new Enum('Type')
        .sortable()
        .filterable()
        .required()
        .creationRules('required')
        .rules('in:' + Object.values(TYPE).join(','))
        .default(TYPE.DISCOUNT)
        .options({
          [TYPE.CHARGE]: 'Charge',
          [TYPE.DISCOUNT]: 'Discount',
        }),

      new Enum('State')
        .sortable()
        .filterable()
        .default(DISCOUNT_SCHEDULED.PENDING)
        .required()
        .creationRules('required')
        .options({
          [DISCOUNT_SCHEDULED.DRAFT]: 'Draft',
          [DISCOUNT_SCHEDULED.PENDING]: 'Pending',
          [DISCOUNT_SCHEDULED.APPLIED]: 'Applied',
          [DISCOUNT_SCHEDULED.CANCELED]: 'Canceled',
          [DISCOUNT_SCHEDULED.PARTIALLY_APPLIED]: 'Partialy Applied',
        }),

      new NumberField('Schedule By', 'fromScheduleId')
        .nullable()
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(attribute, value || null);
        }),

      new TextField('TPV Code', 'tpvCode')
        .sortable()
        .filterable()
        .nullable()
        .default(''),

      new TextField('Trace').nullable().default('').exceptOnForms(),
      new TextField('Key Group', 'keyGroup')
        .nullable()
        .exceptOnForms()
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(attribute, value || null);
        }),

      new NumberField('Compensated By Id', 'compensatedById')
        .nullable()
        .exceptOnForms()
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(attribute, value || null);
        }),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
