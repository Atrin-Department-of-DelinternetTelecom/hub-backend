'use strict';

const { GfPhonePrefix } = require('@models').intranet;
const { respondSuccessWithPagination } = require('@utils/response');
const _ = require('lodash');

const getKeyQuery = (query, key, q, qKey) => {
  if (
    _.has(query, key) &&
    !_.isNull(_.get(query, key)) &&
    !_.isUndefined(_.get(query, key))
  ) {
    q[qKey] = _.get(query, key);
  }
  return q;
};
/**
 * Your GET endpoint
 * get all FeeGroups(information) record
 *
 * returns Object
 **/
exports.getGfPhonePrefix = async function (query) {
  const { offset, limit, page, size } = query;

  let q = {
    offset,
    limit,
  };

  q = getKeyQuery(query, 'search.whereQuery', q, 'where');

  q = getKeyQuery(query, 'search.orderQuery', q, 'order');

  const phonePrefix = await GfPhonePrefix.findAll({
    attributes: ['code', ['description', 'name']],
    group: 'code',
    order: [['description', 'ASC']],
    ...q,
  });
  const count = await GfPhonePrefix.findAll({
    attributes: ['code', ['description', 'name']],
    group: 'code',
    order: [['description', 'ASC']],
  });
  return respondSuccessWithPagination(
    phonePrefix,
    count.length,
    size,
    page,
    query.url,
  );
};
