import * as models from '@api/models';

import { pluck, sortBy } from '@api/utils/collections';

import { CELL_PROVIDER_CODE } from '@api/constants/contracts';
import { GfCellProvider } from '@api/models/intranet/intranet_gf_cell_providers';
import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { Line } from '@delinternet/sdk-aire';
import { Op } from 'sequelize';
import { Static } from '@lib/cache';

const {
  intranet: { GfContract },
} = models;

export const forget = () => {
  Static.forget('CellContracts:cachedCellContracts');
};

export const setupCache = async (
  contracts: number[] = [],
  providers: CELL_PROVIDER_CODE[] = [CELL_PROVIDER_CODE.AIRE],
) => {
  forget();
  await cachedCellContracts(contracts, providers);
};

export const findForLine = async (
  aireLine: Line,
  number: string,
): Promise<models.AnyModel | null> => {
  // search local contract matching number
  // after linked, this contracts are intouchables
  const intranetContracts = sortBy(
    await filterByNumber(number),
    'creationDate',
  );
  const matches = intranetContracts.reverse().filter((contract) => {
    return contract.matchesAireLine(aireLine);
  });

  return matches[0] ?? null;
};

export const findByContractId = async (contractId: number) => {
  return (await cachedCellContracts()).find(({ id }) => id === contractId);
};

export const filterByNumber = async (
  number: string,
): Promise<models.AnyModel[]> => {
  const sortedContracts = sortBy(await cachedCellContracts(), 'creationDate');

  return sortedContracts
    .reverse()
    .filter((contract) => contract.dataCell.number === number);
};

const cachedCellContracts = async (
  contracts: number[] = [],
  providers: CELL_PROVIDER_CODE[] = [CELL_PROVIDER_CODE.AIRE],
): Promise<models.AnyModel[]> => {
  return Static.sear(
    'CellContracts:cachedCellContracts',
    async () => cellContracts(contracts, providers),
    1200,
  );
};

const cellContracts = async (
  contracts: number[] = [],
  providers: CELL_PROVIDER_CODE[] = [CELL_PROVIDER_CODE.AIRE],
): Promise<models.AnyModel[]> => {
  const cellProviders = await GfCellProvider.findAll({
    where: { code: providers },
    attributes: ['id'],
  });

  return GfContract.findAll({
    where: contracts.length ? { id: contracts } : {},
    include: [
      {
        model: GfContractDataCell,
        as: 'dataCell',
        required: true,
        attributes: ['number', 'linkedAireId', 'lastRevision', 'id'],
      },
      {
        model: GfClient,
        as: 'client',
        required: false,
        attributes: ['id', 'fiscalId'],
      },
      {
        model: GfFee,
        as: 'fees',
        required: true,
        where: {
          cellProviderId: { [Op.or]: [pluck(cellProviders, 'id'), null] },
        },
        attributes: ['id', 'cellProviderId'],
        include: [
          {
            model: GfCellProviderFee,
            as: 'cellProviderFees',
            required: false,
          },
        ],
      },
    ],
  });
};
