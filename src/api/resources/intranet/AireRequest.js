//@ts-check
'use strict';

const ID = require('@lib/crud/Fields/ID');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const BooleanField = require('@lib/crud/Fields/Boolean');
const {
  AireRequest: Model,
} = require('@api/models/global/global_aire_requests');
const Json = require('@lib/crud/Fields/Json');
const {
  GfContractDataCell,
} = require('@api/models/intranet/intranet_gf_contract_data_cell');
const { intranet } = require('@api/models');
const CancelAireRequest = require('./actions/CancelAireRequest');
const SubmitAireRequestDocument = require('./actions/SubmitAireRequestDocument');
const { Op } = require('sequelize');
const RetrieveAireRequestDocument = require('./actions/RetrieveAireRequestDocument');
const ArrayField = require('@lib/crud/Fields/Array');
const { Aire } = require('@lib/sdk');
const { default: to } = require('await-to-js');

module.exports = class AireRequest extends Resource {
  configureCreateSwagger = false;
  configureDeleteSwagger = false;
  configureUpdateSwagger = false;

  include = [
    {
      model: GfContractDataCell,
      required: false,
      include: { model: intranet.GfContract, as: 'contract' },
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */ aireData;
  fields(request) {
    return [
      new ID(),

      new Text('number').sortable().filterable(),

      new Text('code').sortable().filterable(),

      new Text('status')
        .resolveUsing((value, resource) => resource.getAireData().estado)
        .filterable(),

      new BooleanField('active')
        .resolveUsing((value, resource) => resource.isActive())
        .filterable(),

      new Text('fiscalId').sortable().filterable(),

      new Text('client')
        .filterable((req, query, value) => ({
          request: {
            [Op.like]: `%"cliente_final":"%${value.replace('%', '')}%`,
          },
        }))
        .resolveUsing(
          (value, resource) => resource.getAireData().cliente_final,
        ),

      new Text('icc')
        .filterable((req, query, value) => ({
          request: { [Op.like]: `%${value.replace('%', '')}%` },
        }))
        .resolveUsing(
          (value, resource) =>
            resource.getAireData().icc + resource.getAireData().icc_dc,
        ),

      new Text('date')
        .filterable((req, query, value) => ({
          request: {
            [Op.like]: `%fecha_insercion":"${value.replace('%', '')}%`,
          },
        }))
        .resolveUsing(
          (value, resource) => resource.getAireData().fecha_insercion,
        ),

      new Text('fee')
        .filterable((req, query, value) => ({
          request: { [Op.like]: `%tarifa":"%${value.replace('%', '')}%` },
        }))
        .resolveUsing((value, resource) => resource.getAireData().tarifa),

      new Text('type')
        .filterable((req, query, value) => ({
          request: { [Op.like]: `%tipo":"${value.replace('%', '')}%` },
        }))
        .resolveUsing((value, resource) => resource.getAireData().tipo),

      new Text('tpvCode', 'tpvCode')
        .resolveUsing((value, resource) => resource.siglas_tarifa)
        .sortable(),

      new Json('data')
        .resolveUsing((value, resource) => resource.getAireData())
        .filterable(),

      new ArrayField('docs')
        .resolveUsing(async (_, resource) => {
          const [error, docs] = await to(
            Aire.getRequestDocuments({ code: resource.code }),
          );
          if (error) {
            console.error(error);
          }

          return Array.isArray(docs) ? docs : [];
        })
        .onlyOnDetail()
        .help(
          'example: [{"id":1, "fecha": "2016-10-26 18:41:37", "tipo_documento": "DOCUMENTO"]]',
        )
        .typeOf('object'),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return Model;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [
      new CancelAireRequest(),
      new SubmitAireRequestDocument(),
      new RetrieveAireRequestDocument(),
    ];
  }
};
