import { AnyModel, intranet } from '@api/models';
import { Meilisearch, Sequelize } from '@lib/search';

import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { Searchable } from '@del-internet/support-search';
import { chunk } from 'lodash';

const {
  GfContract,
  GfContractDataTv,
  GfSection,
  GfContractDataCell,
  GfContractDataFix,
} = intranet;

/**
 * Link the given array of AIRE contracts with the intranet contracts.
 */
export const handle = async (
  contracts: number[] = [],
  shouldRemove = false,
) => {
  const searchable = new Sequelize(new GfContract());

  if (contracts.length === 0) {
    // reset the meilisearch index
    await resetIndex(searchable.searchableAs());
  }

  const chunks = chunk(await getSearchableContracts(contracts), 1000);
  const action = shouldRemove ? 'delete' : 'update';

  for (const chunked of chunks) {
    await Meilisearch[action](chunked);
  }
};

const getSearchableContracts = async (
  only: number[] = [],
): Promise<Searchable[]> => {
  const models = await getAllContracts(only);

  return models.map((contract) => new Sequelize(contract));
};

const getAllContracts = async (only: number[] = []): Promise<AnyModel[]> => {
  return GfContract.findAll({
    where: only.length > 0 ? { id: only } : {},
    include: [
      {
        model: GfFeeGroup,
        as: 'fee_group',
        attributes: ['id'],
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: false,
            attributes: ['code', 'id'],
          },
        ],
        required: false,
      },
      {
        model: GfContractDataCell,
        as: 'dataCell',
        required: false,
        attributes: ['number', 'id', 'icc', 'providerReserveCode'],
      },
      {
        model: GfContractDataFix,
        as: 'dataFix',
        required: false,
        attributes: ['number'],
      },
      {
        model: GfContractDataInternet,
        as: 'dataInternet',
        required: false,
        attributes: [
          'ip',
          'guifiNetIp',
          'infoRepair',
          'cpeSn',
          'nodeRadiusName',
          'instalationDate',
          'installationLevel',
          'staticIp',
          'providerCode',
          'addressRegion',
          'addressProvince',
          'addressCity',
          'addressPostalCode',
          'addressStreet',
          'addressNumber',
          'addressBuilding',
          'addressLat',
          'addressLng',
        ],
      },
      {
        model: GfClient,
        as: 'client',
        required: false,
        attributes: [
          'id',
          'fiscalId',
          'name',
          'contactPhone',
          'contactName',
          'contactFamilyName1',
          'contactFamilyName2',
          'addressCity',
          'addressNumber',
          'addressPostalCode',
          'addressProvince',
          'addressStreet',
        ],
      },
    ],
  });
};

const resetIndex = async (index: string) => {
  await Meilisearch.deleteIndex(index);
  await Meilisearch.createIndex(index);
  await Meilisearch.client.index(index).updateSettings({
    searchableAttributes: [
      'id',
      'reference',
      'alias',
      'dataCell',
      'dataFix',
      'dataInternet',
    ],
    sortableAttributes: ['id'],
    rankingRules: [
      'exactness',
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
    ],
    stopWords: [],
    synonyms: {},
    distinctAttribute: null,
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 6,
        twoTypos: 10,
      },
      disableOnWords: [],
      disableOnAttributes: [],
    },
    faceting: {
      maxValuesPerFacet: 10,
    },
    pagination: {
      maxTotalHits: 50,
    },
  });
};
