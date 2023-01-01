//@ts-check
'use strict';

const ID = require('@lib/crud/Fields/ID');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const BooleanField = require('@lib/crud/Fields/Boolean');
const {
  GfAireContract,
} = require('@api/models/intranet/intranet_gf_aire_contracts');
const Json = require('@lib/crud/Fields/Json');
const { intranet } = require('@api/models');
const { Op } = require('sequelize');

module.exports = class AireLine extends Resource {
  configureCreateSwagger = false;
  configureDeleteSwagger = false;
  configureUpdateSwagger = false;

  include = [{ model: intranet.GfContract, required: false }];

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

      new BooleanField('active').sortable().filterable(),

      new BooleanField('imported')
        .sortable()
        .filterable((req, query, value) => {
          return {
            linkedContractId: Number(value) ? { [Op.ne]: null } : null,
          };
        }),

      new Text('fiscalId', 'fiscalId')
        .resolveUsing((value, resource) => resource.getAireData().fiscalId)
        .filterable((req, query, value) => ({
          aireData: { [Op.like]: `%${value}%` },
        })),

      new Json('data').resolveUsing((value, resource) =>
        resource.getAireData(),
      ),

      new Text('tpvCode', 'tpvCode')
        .resolveUsing((value, resource) => resource.siglas)
        .sortable(),

      new Text('client')
        .filterable((req, query, value) => ({
          aireData: {
            [Op.like]: `%"cliente_final"%${value.replace('%', '')}%`,
          },
        }))
        .resolveUsing(
          (value, resource) => resource.getAireData().cliente_final,
        ),

      new Json('sims')
        .filterable((req, query, value) => ({
          aireData: { [Op.like]: `%"sims"%${value.replace('%', '')}%` },
        }))
        .resolveUsing((value, resource) => resource.getAireData().sims),

      new Text('date')
        .filterable((req, query, value) => ({
          aireData: {
            [Op.like]: `%fecha_alta"%${value.replace('%', '')}%`,
          },
        }))
        .resolveUsing((value, resource) => resource.getAireData().fecha_alta),

      new Text('lineId', 'lineId')
        .resolveUsing((value, resource) => resource.id_linea)
        .sortable(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GfAireContract;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [];
  }
};
