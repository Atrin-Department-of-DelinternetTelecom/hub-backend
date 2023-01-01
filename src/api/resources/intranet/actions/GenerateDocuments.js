//@ts-check
'use strict';
const Action = require('@lib/crud/Action');
const NumberField = require('@lib/crud/Fields/Number');
const { GfContract, GfClient } = require('@models').intranet;
const { chunk } = require('lodash');
const { ensureOfDocument } = require('@api/service/intranet/GfContractService');
const { Op, literal } = require('sequelize');
const { intranet: knex } = require('@lib/knex');

module.exports = class GenerateDocuments extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {AnyModel[]} models
   * @param {{limit: number; per_page:number}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const resources = request.input('resources', []);
    const ref = 'gf_docs@' + Date.now();
    const subQuery = knex(`intranet.gf_docs AS ${ref}`)
      .select(1)
      .limit(1)
      .where(`${ref}.status`, '=', 1)
      .where(`${ref}.contractId`, '=', knex.raw('`GfContract`.`id`'));

    const where = { [Op.and]: [literal(`NOT EXISTS (${subQuery.toQuery()})`)] };

    if (resources.length) {
      where.id = resources;
    }

    models = await GfContract.findAll({
      where,
      limit: fields.limit > 0 ? fields.limit : 100,
      include: [
        {
          model: GfClient,
          as: 'client',
        },
      ],
    });

    const results = [];
    for (const chunks of chunk(models, fields.per_page ?? 20)) {
      results.push(
        await Promise.allSettled(
          chunks.map(async (contract) => {
            await ensureOfDocument(contract);

            return contract.id;
          }),
        ),
      );
    }

    return results
      .flat()
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new NumberField('limit').default(100),
      new NumberField('per_page').default(20),
    ];
  }
};
