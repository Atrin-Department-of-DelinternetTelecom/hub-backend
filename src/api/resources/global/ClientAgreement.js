'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const DecimalField = require('@lib/crud/Fields/Decimal');
const EnumField = require('@lib/crud/Fields/Enum');
const JsonField = require('@lib/crud/Fields/Json');
const Resource = require('@lib/crud/Resource');
const { system, intranet } = require('@models');
const {
  DelinternetStorage,
} = require('@api/service/documents/storages/DelinternetStorage');
const { TYPE } = require('@api/constants/documents');
const { Op, Sequelize } = require('sequelize');
module.exports = class ClientAgreement extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: system.User,
      as: 'creator',
    },
    {
      model: system.User,
      as: 'reviewer',
      required: false,
    },
    {
      model: intranet.GfContract,
      required: true,
      as: 'contract',
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),
      new NumberField('contract_id').nullable(),
      new DecimalField('permanence_fine').nullable(),
      new DateTime('end_of_permanence').nullable(),
      new NumberField('number_of_payments').nullable(),
      new DecimalField('payment_value').nullable(),
      new EnumField('status')
        .filterable()
        .sortable()
        .options({
          pending: 'pending',
          checked: 'checked',
        })
        .nullable(),
      new DateTime('created_at').exceptOnForms(),
      new DateTime('updated_at').exceptOnForms(),
      new JsonField('client', 'client')
        .onlyOnIndex()
        .filterable(function (request, query, value, operator) {
          query.include.push({
            model: intranet.GfContract,
            as: 'contract',
            required: true,
            include: [
              {
                model: intranet.GfClient,
                as: 'client',
                required: true,
                where: {
                  name: {
                    [Op.like]: `%${value.replace(/%/g, '')}%`,
                  },
                },
              },
            ],
          });
        }),
      new NumberField('creator_id')
        .sortable()
        .nullable()
        .fillUsing((request, model, attribute) => {
          model.setDataValue(attribute, request.user.id);
        }),
      new JsonField('creator', 'creator')
        .onlyOnIndex()
        .filterable(function (request, query, value, operator) {
          query.include.push({
            model: system.User,
            as: 'creator',
            required: true,
            where: {
              [Op.and]: Sequelize.where(
                Sequelize.fn(
                  'CONCAT',
                  Sequelize.col('first_name'),
                  ' ',
                  Sequelize.col('last_name'),
                ),
                'LIKE',
                `%${value.replace(/%/g, '')}%`,
              ),
            },
          });
        }),
      new NumberField('reviewer_id')
        .filterable()
        .sortable()
        .nullable()
        .fillUsing((request, model, attribute) => {
          request.body.status == 'checked' &&
            model.setDataValue(attribute, request.user.id);
        }),
      new JsonField('reviewer', 'reviewer')
        .onlyOnIndex()
        .filterable(function (request, query, value, operator) {
          query.include.push({
            model: system.User,
            as: 'reviewer',
            required: true,
            where: {
              [Op.and]: Sequelize.where(
                Sequelize.fn(
                  'CONCAT',
                  Sequelize.col('first_name'),
                  ' ',
                  Sequelize.col('last_name'),
                ),
                'LIKE',
                `%${value.replace(/%/g, '')}%`,
              ),
            },
          });
        }),
      new DateTime('review_date')
        .nullable()
        .fillUsing((request, model, attribute) => {
          request.body.status == 'checked' &&
            model.setDataValue(attribute, new Date());
        }),
      new NumberField('doc_id')
        .exceptOnForms()
        .resolveUsing((value) => `del:${value}`),
    ];
  }
  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.ClientAgreement;
  }

  /**
   * while creating new client registration.
   *
   * @param {*} model
   * @param {*} req
   */
  async creating(req, model) {
    const doc = await DelinternetStorage.create(
      TYPE.CLIENT_AGREEMENT,
      req.user.id,
    );
    model.setDataValue('doc_id', doc.id);
  }

  uriKey() {
    return 'client-agreements';
  }
};
