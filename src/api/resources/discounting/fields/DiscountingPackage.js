//@ts-check
'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const ArrayField = require('@lib/crud/Fields/Array');
const Enum = require('@lib/crud/Fields/Enum');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const BooleanField = require('@lib/crud/Fields/Boolean');

module.exports = class extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),

      new Text('Name').required().rules('required'),

      new Enum('Type')
        .options({ charge: 'Charge', discount: 'Discount' })
        .sortable()
        .filterable()
        .required()
        .rules('required')
        .default('discount'),

      new NumberField('Months')
        .default(1)
        .rules('min:1')
        .required()
        .sortable()
        .filterable(),

      new NumberField('Creator Id')
        .filterable()
        .sortable()
        .nullable()
        .fillUsing((request, model, attribute) => {
          model.setDataValue(
            attribute,
            request.input(attribute) || request.user.userId,
          );
        }),

      new NumberField('Activation Age')
        .default(30)
        .rules('min:1')
        .required()
        .sortable()
        .filterable(),

      new BooleanField('Enabled')
        .filterable()
        .sortable()
        .required()
        .default(true),

      new Text('Code')
        .virtual((attribute, model) => `PACK/${model.id}`)
        .exceptOnForms(),

      new ArrayField('Fee Groups')
        .required()
        .rules('required')
        .help('example: [{"id":1, "type": "fix", "amount": 10]]')
        .typeOf('object')
        .hideOnSequelize()
        .fillUsing((req, model, attribute) => {
          const feeGroups = req.input(attribute);

          return async (req, model) => {
            // sync fee groups
            await model.setGfFeeGroups([]);
            await model.sequelize.models.DiscountingPackageFee.bulkCreate(
              feeGroups.map(({ id, type, amount }) => ({
                discounting_package_id: model.id,
                gf_fee_group_id: id,
                amount,
                type,
              })),
            );
          };
        })
        .resolveUsing((value, model) => {
          return model.GfFeeGroups.map((feeGroup) => {
            return {
              id: feeGroup.id,
              amount: feeGroup.DiscountingPackageFee.amount,
              type: feeGroup.DiscountingPackageFee.type,
            };
          });
        }),

      new ArrayField('Clients')
        .hideOnSequelize()
        .nullable()
        .fillUsing((req, model, attribute) => {
          if (!req.filled(attribute)) {
            return;
          }

          return async (req, model) => {
            const clients = req.input(attribute);
            // sync clients
            await model.setGfClients([]);
            await model.sequelize.models.DiscountingPackageClient.bulkCreate(
              clients.map((id) => {
                return {
                  discounting_package_id: model.id,
                  gf_client_id: id,
                };
              }),
            );
          };
        })
        .resolveUsing((value, model) => {
          return model.GfClients.map((client) => client.id);
        }),

      new ArrayField('Tags')
        .hideOnSequelize()
        .nullable()
        .fillUsing((req, model, attribute) => {
          if (!req.filled(attribute)) {
            return;
          }

          return async (req, model) => {
            const tags = req.input(attribute);
            // sync tags
            await model.setInvoiceClientsExtraFields([]);
            await model.sequelize.models.DiscountingPackageTag.bulkCreate(
              tags.map((id) => {
                return {
                  discounting_package_id: model.id,
                  invoice_clients_extra_field_id: id,
                };
              }),
            );
          };
        })
        .resolveUsing((value, model) => {
          return model.InvoiceClientsExtraFields.map((tag) => tag.id);
        }),

      new DateTime('Start Date')
        .filterable()
        .sortable()
        .required()
        .rules('required'),

      new DateTime('Expiration Date')
        .filterable()
        .sortable()
        .required()
        .rules('required'),

      new DateTime('Creation Date', 'created_at').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updated_at').exceptOnForms().nullable(),
    ];
  }
};
