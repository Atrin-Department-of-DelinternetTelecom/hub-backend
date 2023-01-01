import { ContractCondition, ProviderCondition } from '../contracts';

import { GfActiveFee } from '@api/models/intranet/intranet_active_fee';
import { GfCellProvider } from '@api/models/intranet/intranet_gf_cell_providers';
import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { SERVICE } from '@api/constants/contracts';
import assert from 'assert';
import { findOrFail } from '../../Actions/Caches/GfContractSectionStatusCaches';
import { getActualConditions } from '../../Fee/GfFeeService';
import { intranet } from '@api/models';

const { GfContract } = intranet;

export const getContractConditions = async (
  contractId: number,
): Promise<ContractCondition> => {
  const { contract, row } = await findOrFail<GfContractDataCell>(contractId);
  assert(row, `missing data section for contract [${contractId}]`);
  return {
    contract,
    dataCell: row,
    client: (await GfClient.findByPk(contract.clientId))!,
    ...(await getProviderConditions(contract.feeGroupId)),
  };
};

export const getProviderConditions = async (
  feeGroupId: number,
): Promise<ProviderCondition> => {
  const condition = await getActualConditions(feeGroupId);
  assert(
    condition,
    `[getProviderConditions] Missing Actual Conditions [feeGroupId:${feeGroupId}]`,
  );
  const cellFee = await GfCellProviderFee.findByPk(condition.cellFee, {
    include: [
      {
        model: GfCellProvider,
        as: 'provider',
      },
    ],
  });
  assert(
    cellFee,
    `[getProviderConditions] Cell tarifa not found [feeGroupId:${feeGroupId}][cellFee:${condition.cellFee}]`,
  );

  return { condition, cellFee, provider: cellFee.provider as GfCellProvider };
};

export const provider = async (contractId: number) => {
  const contract = await GfContract.findByPk(contractId, {
    include: {
      model: GfFeeGroup,
      as: 'fee_group',
      attributes: ['id', 'provider'],
      include: [
        {
          model: GfSection,
          as: 'sections',
          attributes: ['code'],
        },
        {
          model: GfActiveFee,
          as: 'gf_active_fee',
          attributes: ['cellProviderId'],
          include: [
            {
              model: GfCellProvider,
              as: 'cellProvider',
              required: false,
              attributes: ['code'],
            },
          ],
        },
      ],
    },
  });

  if (!contract || !contract.fee_group) {
    return null;
  }

  if (contract.fee_group.sections[0].code !== SERVICE.CELL) {
    return null;
  }

  return contract.fee_group.provider;
};
