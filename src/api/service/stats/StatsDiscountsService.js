// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;

const { getAllEntities } = require('@utils/request-handler');

const {
  intranet: {
    GfDiscountsMatrix,
    DiscountClientInfo,
    GfDiscountsExecuted,
    DiscountContractTag,
  },
} = require('@models');

const config = require('@config');
const {
  respondSuccess,
  respondSuccessWithPagination,
} = require('@utils/response');
const { intranet } = require('@lib/knex');
const { pluck } = require('@api/utils/collections');

const uid = config.get('index.intranet.uid');

exports.getContractsDiscountSummary = async function () {
  const result = await knex('gf_contracts')
    .select('percentageDiscount')
    .count('*', { as: 'count' })
    .where({
      status: 1,
      state: 'active',
      uid,
    })
    .groupByRaw('IFNULL(percentageDiscount, 0)')
    .orderBy('count', 'desc');

  return respondSuccess(result);
};

exports.getPackageDiscountSummary = async function (query) {
  return getAllEntities(query, GfDiscountsExecuted, undefined, [
    {
      model: DiscountContractTag,
      as: 'tags',
      required: false,
    },
    {
      model: DiscountClientInfo,
      as: 'clientInfo',
    },
    {
      model: GfDiscountsMatrix,
      as: 'matrix',
    },
  ]);
};

exports.getPackageDiscountSummaries = async function (req, query) {
  const size = Number(query.size) || 10;
  const page = Number(query.page) || 1;
  const offset = (page - 1) * size;
  const filters = req.filters();
  const orders = req.orders();
  // apply filters

  const baseQuery = intranet
    .table('gf_discounts_executed')
    .select('*')
    .where('gf_discounts_executed.uid', uid)
    .where('gf_discounts_executed.status', 1);

  if (filters['matrix.alias']?.value) {
    baseQuery.whereExists(
      intranet
        .select('*')
        .from('gf_discounts_matrix')
        .whereRaw(
          'gf_discounts_matrix.id = gf_discounts_executed.matrixId AND gf_discounts_matrix.alias LIKE ?',
          [`%${filters['matrix.alias'].value.replace(/%/g, '')}%`],
        ),
    );
  }

  if (filters['clientInfo.clientName']?.value) {
    baseQuery.whereExists(
      intranet
        .select('*')
        .from('discount_client_info_view')
        .where('executed_id', intranet.ref('gf_discounts_executed.id'))
        .where(
          'client_name',
          'like',
          `%${filters['clientInfo.clientName'].value.replace(/%/g, '')}%`,
        ),
    );
  }

  if (filters['tags.tagId']?.value) {
    const tags = Array.isArray(filters['tags.tagId']?.value)
      ? filters['tags.tagId']?.value
      : [filters['tags.tagId']?.value];

    baseQuery.whereExists(
      intranet
        .select('*')
        .from('discount_contract_tag_view')
        .whereRaw(
          'discount_contract_tag_view.executed_id = gf_discounts_executed.id AND discount_contract_tag_view.tag_id IN (?)',
          [tags.join(',')],
        ),
    );
  }

  if (filters.active) {
    baseQuery.where(
      'gf_discounts_executed.active',
      Number(filters.active.value),
    );
  }

  if (filters.init) {
    baseQuery.whereBetween('gf_discounts_executed.init', filters.init.value);
  }

  /// apply ordering

  if (orders.init?.direction) {
    baseQuery.orderBy('gf_discounts_executed.init', orders.init.direction);
  }

  if (orders['clientInfo.clientName']?.direction) {
    baseQuery.orderBy(
      intranet.raw(
        "IFNULL((SELECT client_name FROM discount_client_info_view WHERE executed_id = gf_discounts_executed.id), '')",
      ),
      orders['clientInfo.clientName'].direction,
    );
  }

  const [count, entities] = await Promise.all([
    baseQuery.clone().count('* as count').first(),
    baseQuery.clone().limit(size).offset(offset),
  ]);

  const [clientInfos, matrices, tags] = await Promise.all([
    intranet
      .table('discount_client_info_view')
      .select('*')
      .whereIn('executed_id', pluck(entities, 'id')),
    intranet
      .table('gf_discounts_matrix')
      .select('*')
      .whereIn('id', pluck(entities, 'matrixId')),
    intranet
      .table('discount_contract_tag_view')
      .select('*')
      .whereIn('executed_id', pluck(entities, 'id')),
  ]);

  return respondSuccessWithPagination(
    entities.map((entity) => {
      const clientInfo = clientInfos.find(
        ({ executed_id }) => executed_id === entity.id,
      );
      const matrix = matrices.find(({ id }) => id === entity.matrixId);
      const entityTags = tags.filter(
        ({ executed_id }) => executed_id === entity.id,
      );

      return {
        ...entity,
        clientInfo: clientInfo ?? null,
        matrix: matrix ?? null,
        tags: entityTags.map((tag) => ({
          ...tag,
          tag_name: JSON.parse(tag.tag_name),
        })),
      };
    }),
    count.count || 0,
    Number(size),
    Number(page),
    query.url,
  );
};
