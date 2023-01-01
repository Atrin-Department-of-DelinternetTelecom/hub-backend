const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const {
  OperadorLandline,
} = require('@api/models/intranet/intranet_operador_landline');
const { pluck } = require('@api/utils/collections');
const InboundPortability = require('./InboundPortability');
const { GfContract } = require('@models').intranet;

module.exports = class ExecutePortability extends InboundPortability {
  /**
   * Preapre field for json.
   *
   * @param {any} request
   * @param {OperadorLandline[]} models
   * @param {{landlines: {data: Buffer}, delimiter: string, number_column: number, fiscal_column: number, exclude:Array<number>}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const contracts = await GfContract.findAll({
      include: [{ model: GfClient, as: 'client' }],
      where: { id: pluck(models, 'contractId') },
    });
    const clients = pluck(contracts, 'client', 'id');

    await Promise.all(
      models.map(async (model) => {
        const fiscalId = clients[model.contractId]?.fiscalId ?? null;
        const [landline, created] = await OperadorLandline.findOrCreate({
          where: { number: model.number },
          defaults: { fiscal_id: fiscalId, number: model.number },
        });

        if (!created && !landline.fiscal_id) {
          await landline.update({ fiscal_id: fiscalId });
        }
      }),
    );

    return super.handle(
      request,
      await OperadorLandline.findAll({
        where: { number: pluck(models, 'number') },
      }),
      fields,
    );
  }
};
