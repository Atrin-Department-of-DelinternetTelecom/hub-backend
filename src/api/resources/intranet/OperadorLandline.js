//@ts-check
'use strict';

const { ASSIGNABLE } = require('@api/constants/statuses');
const {
  OperadorLandline: OperadorLandlineModel,
} = require('@api/models/intranet/intranet_operador_landline');
const { GfContract } = require('@models').intranet;
const { StatusEnum } = require('@api/service/intranet/OperadorFixFacade');
const { associateBy } = require('@api/utils/collections');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const ImportLandlines = require('./actions/ImportLandlines');
const InboundPortability = require('./actions/InboundPortability');
const ImportLandlineFromContracts = require('./actions/ImportLandlineFromContracts');
const RevisionPortability = require('./actions/RevisionPortability');
const BooleanField = require('@lib/crud/Fields/Boolean');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const { col, Op, literal } = require('sequelize');
const { isFalsy, isTruthy } = require('@api/utils/helpers');

const { intranet: knex } = require('@lib/knex');
const RandomNumber = require('./actions/RandomNumber');

module.exports = class OperadorLandline extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: GfContract,
      attributes: ['id', 'reference', 'clientId'],
      required: false,
    },
    {
      model: GfClient,
      required: false,
      as: 'client',
      attributes: ['name', 'id', 'fiscalId'],
      where: { fiscalId: { [Op.and]: [{ [Op.not]: null }, { [Op.not]: '' }] } },
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),
      new Text('number').sortable().filterable(),
      new Text('fiscal_id').sortable().filterable(),
      new Text('operador_fiscal_id').sortable().filterable(),
      new Text('owner').sortable().filterable(),
      new Text('provider').sortable().filterable().nullable(),
      new Text('revenedor').sortable().filterable().nullable(),
      new NumberField('gf_contract_id').sortable().filterable(),
      new BooleanField('owner_exists')
        .exceptOnForms()
        .resolveUsing((value, resource) => !!resource.client)
        .filterable((req, query, value) => {
          const subQuery = knex('intranet.gf_clients AS x')
            .select(1)
            .limit(1)
            .where('x.fiscalId', '=', knex.raw('OperadorLandline.fiscal_id'))
            .toQuery();

          if (query.where[Op.and] === undefined) {
            query.where[Op.and] = [];
          }
          if (!Array.isArray(query.where[Op.and])) {
            query.where[Op.and] = [query.where[Op.and]];
          }
          query.where[Op.and].push(
            literal(
              `${isTruthy(value) ? 'EXISTS' : 'NOT EXISTS'} (${subQuery})`,
            ),
          );
        }),
      new Enum('state')
        .options(associateBy(Object.values(ASSIGNABLE), (val) => val))
        .sortable()
        .filterable(),
      new Enum('portability')
        .options(associateBy(Object.keys(StatusEnum), (val) => val))
        .sortable()
        .filterable(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return OperadorLandlineModel;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [
      new ImportLandlineFromContracts().standalone(),
      new ImportLandlines().standalone(),
      new InboundPortability(),
      new RevisionPortability(),
      new RandomNumber().standalone(),
    ];
  }
};
