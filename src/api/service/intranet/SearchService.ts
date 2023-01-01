import { Builder, Direction, Searchable } from '@del-internet/support-search';
import { Manager, Sequelize } from '@lib/search';

import { AnyModel } from '@api/models';
import { respondSuccessWithPagination } from '@api/utils/response';
import to from 'await-to-js';

export type Query = {
  size: number;
  page: number;
  q: string;
  url?: URL;
};
export type Order = {
  order: string;
  direction: Direction;
};

const makeBuilder = (searchable: Searchable, options: Query) => {
  return Builder.within(searchable.searchableAs())
    .search(options.q)
    .take(Number(options.size))
    .ignore(Number(options.page - 1 || 0) * Number(options.size));
};

const applyOrders = (builder: Builder, orders: Order[]): Builder => {
  orders.forEach((order) => {
    builder.orderBy(order.order, order.direction);
  });

  return builder;
};

const performSearch = async (builder: Builder) => {
  const [error, records] = await to(
    Manager.driver('meilisearch').search(builder),
  );

  if (error) {
    console.error(error);
  }

  return {
    records: error ? [] : records.hits,
    count: error ? 0 : records.estimatedTotalHits,
  };
};

/**
 * Search through meilisearch for given model and search options.
 */
export const search = async (
  model: AnyModel,
  options: Partial<Query>,
  orders: Order[],
) => {
  const query: Query = {
    size: 50,
    page: 1,
    q: '',
    ...options,
  };

  const { records, count } = await performSearch(
    applyOrders(makeBuilder(new Sequelize(model), query), orders),
  );

  return respondSuccessWithPagination(
    records,
    count,
    query.size,
    query.page,
    query.url,
  );
};
