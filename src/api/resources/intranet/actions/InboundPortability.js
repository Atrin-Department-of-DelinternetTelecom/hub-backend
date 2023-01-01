//@ts-check
'use strict';

const Action = require('@lib/crud/Action');
const { associateBy } = require('@api/utils/collections');
const {
  default: operadorFixFacadeInstance,
} = require('@api/service/intranet/OperadorFixFacade');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const assert = require('assert');
const {
  handle: RevisionLandlines,
} = require('@api/service/intranet/Actions/RevisionLandlines');
const { firstPopulated } = require('@api/utils/helpers');
const Text = require('@lib/crud/Fields/Text');

const getParams = (/** @type {Record<string, any>} */ fields = {}) => {
  /** @type {Record<string, any>} */
  const params = {};
  Object.keys(fields).forEach((key) => {
    if (fields[key]) {
      params[key] = fields[key];
    }
  });

  return params;
};

module.exports = class InboundPortability extends Action {
  /**
   * Preapre field for json.
   *
   * @param {any} request
   * @param {OperadorLandline[]} models
   * @param {{landlines: {data: Buffer}, delimiter: string, number_column: number, fiscal_column: number, exclude:Array<number>}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    /** @type {Record<string, GfClient>} */
    const clients = associateBy(
      await GfClient.findAll({
        where: { fiscalId: models.map(({ fiscal_id }) => fiscal_id) },
      }),
      ({ fiscalId }) => fiscalId,
    );

    let results = [];
    const params = getParams(fields);

    if (models.length === 1) {
      const client = clients[models[0].fiscal_id];
      if (Object.keys(params).length === 0) {
        assert(client, 'Client not found in the hub');
      }
      if (!client) {
        assert(
          params.name || models[0].ownerFiscalId(),
          'Client name is mandatory',
        );
        assert(
          params.nif || models[0].ownerFiscalId(),
          'Client nif is mandatory',
        );
        assert(params.zip, 'Client zip is mandatory');
        assert(params.province_code, 'Client province code is mandatory');
      }
      await this.inboundPortability(
        {
          ...client?.get({ plain: true }),
          ...params,
          fiscalId: firstPopulated([
            params.nif,
            client?.fiscalId,
            models[0].ownerFiscalId(),
          ]),
          addressPostalCode: firstPopulated([
            params.zip,
            client?.addressPostalCode,
          ]),
          addressProvinceCode: firstPopulated([
            params.province_code,
            client?.addressProvinceCode,
          ]),
          name: firstPopulated([params.name, client?.name, models[0].owner]),
        },
        models[0],
        params,
      );
    } else {
      results = await Promise.allSettled(
        models.map(async (model) => {
          const client = clients[model.fiscal_id];
          assert(client, 'Client not found in the hub');
          return this.inboundPortability(client, model, params);
        }),
      );
    }

    await RevisionLandlines(models);

    return results.map((result) => {
      if (result.status === 'rejected') {
        result.reason = result.reason.message;
      }

      return result;
    });
  }

  async inboundPortability(client, landlineModel, params = {}) {
    const customer = await operadorFixFacadeInstance.executeCustomer(client);
    assert(
      customer.success,
      firstPopulated([
        customer.reason,
        customer.error,
        `Error on customer creation [fiscalId:${landlineModel.fiscal_id}]`,
      ]),
    );
    const portability = await operadorFixFacadeInstance.executePortabilities(
      client,
      {
        extension: landlineModel.number,
        reseller: landlineModel.provider ? landlineModel.revenedor : undefined,
        ...params,
      },
    );

    assert(
      portability.success,
      firstPopulated([
        portability.reason,
        portability.error,
        `Error on execute portability [fiscalId:${landlineModel.fiscal_id}]`,
      ]),
    );
  }

  fields() {
    return [
      new Text('name').nullable(),
      new Text('nif').nullable(),
      new Text('zip').nullable(),
      new Text('province_code').nullable(),
      new Text('reseller').nullable(),
      new Text('provider').nullable(),
      new Text('city').nullable(),
      new Text('process_code').nullable(),
      new Text('type_code').nullable(),
      new Text('wholesale_code').nullable(),
    ];
  }
};
