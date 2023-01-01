import { ASSIGNABLE, CONTRACT } from '@api/constants/statuses';
import operadorFixFacadeInstance, { statusMapping } from '../OperadorFixFacade';

import { Op } from 'sequelize';
import { OperadorLandline } from '@api/models/intranet/intranet_operador_landline';
import assert from 'assert';
import { firstPopulated } from '@api/utils/helpers';
import { intranet } from '@api/models';
import { pluck } from '@api/utils/collections';
import to from 'await-to-js';

const { GfContract, GfContractDataFix } = intranet;

/**
 * Revision given aire contracts.
 */
export const handle = async (landlines: OperadorLandline[], userId = 0) => {
  const contracts = await contractsByNumber(landlines);
  // do sync
  for (const landline of landlines) {
    if (contracts[landline.number]) {
      landline.set({
        gf_contract_id: contracts[landline.number] ?? null,
        state: ASSIGNABLE.ASSIGNED,
      });
    }

    const owner = landline.ownerFiscalId();
    const [error, portability] = await to(
      operadorFixFacadeInstance.getInboundPortability({
        number: String(landline.number),
      }),
    );

    if (error || portability?.success === false) {
      await landline.save();
      console.log(error ?? portability?.error, landline.number, owner);
      continue;
    }

    const { data } = portability;
    assert(data, 'Invalid response');
    const operadorFiscalId =
      data.status === 'CONSOLIDATED' ? data.fiscal_id : owner;

    landline.set({
      fiscal_id: firstPopulated([landline.fiscal_id, operadorFiscalId]),
      operador_fiscal_id: operadorFiscalId,
      portability: data.status ?? null,
      owner: firstPopulated([landline.owner, data.customer_name]),
      provider: firstPopulated([landline.provider, data.operator_name]),
      revenedor: firstPopulated([landline.revenedor, data.reseller_name]),
    });

    await landline.save();
  }
};

const contractsByNumber = async (landlines: OperadorLandline[]) => {
  return pluck(
    await GfContractDataFix.findAll({
      where: { number: pluck(landlines, 'number') },
      attributes: ['id', 'number', 'contractId'],
      raw: true,
      include: [
        {
          model: GfContract,
          as: 'contract',
          where: { state: { [Op.not]: CONTRACT.SUSPENDED } },
          attributes: ['id'],
        },
      ],
    }),
    'contractId',
    'number',
  );
};
