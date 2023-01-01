import { Knex } from 'knex';
import { Query, queries, union } from './queries';
import { getConnectionFor } from '@lib/sequelize';
import { QueryTypes } from 'sequelize';
import assert from 'assert';

const intranet = getConnectionFor('intranet');

const pickQueries = (types: string[]): Query[] => {
  return Object.entries(queries)
    .filter(([key]) => types.includes(key))
    .map(([k, v]) => v);
};

const allQueries = Object.entries(queries).map(([k, v]) => v);

/**
 * return all the docs related to a single client
 */
export async function getAllDocs(
  clientId: number, // we need clientId, because a single contract can have many documents, because of change holder (each holder, one new document)
  contractId: number,
  options: {
    only?: string[];
    page?: number;
    pageSize?: number;
  },
) {
  assert(intranet);

  const pickedQueries = options.only ? pickQueries(options.only) : allQueries;
  const q = union(pickedQueries.map((q) => q(clientId, contractId)));
  if (options.page && options.pageSize) {
    q.limit(options.pageSize).offset((options.page - 1) * options.pageSize);
  }

  const { sql, bindings } = q.toSQL().toNative();
  const result = await intranet.query(
    {
      query: sql,
      values: bindings as unknown[],
    },
    {
      type: QueryTypes.SELECT,
    },
  );

  result.map((r: any) => transformBooleans(r, ['signed', 'baseDataComplete']));

  return result;
}

const transformBooleans = (obj: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    obj[key] = Boolean(obj[key]);
  }
};
