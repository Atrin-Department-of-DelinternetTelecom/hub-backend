'use strict';

import connections, { Knex } from '@lib/knex';

import assert from 'assert';

export default async function deferredRecordUpdate(params: {
  table: string;
  connection: string;
  keys: Record<string, unknown>;
  data: Record<string, unknown>;
}) {
  console.log(`Update records from table "${params.table}"`, params);

  assert(
    connections.intranet,
    `Connection "${params.connection}" is invalid KnexJS connection!`,
  );

  await (connections[params.connection] as Knex)
    .table(params.table)
    .whereIn('id', Array.isArray(params.keys) ? params.keys : [params.keys])
    .update(params.data);
}
