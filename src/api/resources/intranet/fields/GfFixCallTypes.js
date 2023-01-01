//@ts-check
'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const Decimal = require('@lib/crud/Fields/Decimal');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const ArrayField = require('@lib/crud/Fields/Array');
const models = require('@models');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const Textarea = require('@lib/crud/Fields/Textarea');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');
const { syncMtoN } = require('../../../utils/sequelize');

module.exports = class GfFixCallTypes extends ResolvesFields {
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

      new TextField('name').required(),

      new NumberField('primary').nullable(),

      new Enum('priceType', 'priceType')
        .sequelize('type', 'enum')
        .nullable()
        .default('')
        .options({
          byCost: 'byCost',
          byMinutes: 'byMinutes',
        }),

      new Decimal('priceValue', 'priceValue')
        .nullable()
        .length(11, 8)
        .default(0.0),

      new TextField('kamailioRef', 'kamailioRef').nullable(),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new ArrayField('code', 'code')
        .nullable()
        .default([])
        .onlyOnForms()
        .typeOf('string')
        .rules(async (value, attribute, fail) => {
          const Model = models.intranet.GfPhonePrefix;
          const prefixes = await Model.findAll({ where: { code: value } });
          if (prefixes.length !== value.length) fail(`invalid prefixes`);
        })
        .fillUsing((req, model, attribute) => {
          if (!request.has(attribute)) return;

          return async (req, model, transaction) => {
            await syncMtoN(
              models.intranet.GfPhonePrefixGroupsXref,
              'fixCallTypeId',
              model.id,
              'prefixCode',
              req.body[attribute],
            );
          };
        }),
      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
