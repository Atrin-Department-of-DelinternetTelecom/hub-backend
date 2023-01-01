import { AnyModel, intranet } from '@api/models';
import { Meilisearch, Sequelize } from '@lib/search';

import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { Searchable } from '@del-internet/support-search';
import { chunk } from 'lodash';

const { InvoiceClientsExtraField } = intranet;

/**
 * Link the given array of AIRE contracts with the intranet contracts.
 */
export const handle = async (clients: number[] = [], shouldRemove = false) => {
  const searchable = new Sequelize(new GfClient());

  if (clients.length === 0) {
    // reset the Meilisearch index
    await resetIndex(searchable.searchableAs());
  }

  const chunks = chunk(await getSearchableClients(clients), 1000);
  const action = shouldRemove ? 'delete' : 'update';

  for (const chunked of chunks) {
    await Meilisearch[action](chunked);
  }
};

const getSearchableClients = async (
  only: number[] = [],
): Promise<Searchable[]> => {
  const models = await getAllClients(only);

  return models.map((client) => new Sequelize(client));
};

const getAllClients = async (only: number[] = []): Promise<AnyModel[]> => {
  return GfClient.findAll({
    where: only.length > 0 ? { id: only } : {},
    include: [
      {
        model: InvoiceClientsExtraField,
        as: 'extraFields',
        attributes: ['name'],
        required: false,
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
      'fiscalId',
      'name',
      'emailAddress',
      'contactPhone',
      'address',
      'aireCode',
      'extraFields',
    ],
    filterableAttributes: ['id', 'userId', 'fiscalId'],
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
