//@ts-check
'use strict';

const Action = require('@lib/crud/Action');
const ArrayField = require('@lib/crud/Fields/Array');
const {
  OperadorLandline,
} = require('@api/models/intranet/intranet_operador_landline');
const { pluck } = require('@api/utils/collections');
const {
  handle: RevisionLandlines,
} = require('@api/service/intranet/Actions/RevisionLandlines');
const { ASSIGNABLE } = require('@api/constants/statuses');
const { GfContract, GfClient, GfContractDataFix } =
  require('@api/models').intranet;

module.exports = class ImportLandlineFromContracts extends Action {
  /**
   * Preapre field for json.
   *
   * @param {any} request
   * @param {unknown[]} models
   * @param {{numbers:Array<string|number>}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const contracts = await GfContract.findAll({
      attributes: ['id'],
      include: [
        {
          model: GfClient,
          as: 'client',
          required: false,
          attributes: [
            'name',
            'contactName',
            'contactFamilyName1',
            'contactFamilyName2',
            'fiscalId',
          ],
        },
        {
          model: GfContractDataFix,
          as: 'dataFix',
          where: { number: fields.numbers },
          attributes: ['number', 'id'],
        },
      ],
    });
    const exists = pluck(
      await OperadorLandline.findAll({
        where: { number: fields.numbers },
        attributes: ['number'],
      }),
      'number',
    );

    const newRecords = contracts.filter(
      ({ dataFix }) => !exists.includes(dataFix.number),
    );

    await OperadorLandline.bulkCreate(
      newRecords.map(({ id, dataFix, client }) => {
        return {
          number: dataFix.number,
          fiscal_id: client.fiscalId,
          gf_contract_id: id,
          state: ASSIGNABLE.ASSIGNED,
          owner:
            client.name ??
            [
              client.contactName,
              client.contactFamilyName1,
              client.contactFamilyName2,
            ]
              .filter((val) => val)
              .join(' '),
        };
      }),
    );

    RevisionLandlines(
      await OperadorLandline.findAll({
        where: { number: fields.numbers },
      }),
    ).catch(console.log);
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [new ArrayField('numbers').rules('required').required()];
  }
};
