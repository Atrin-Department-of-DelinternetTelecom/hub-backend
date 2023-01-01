'use strict';

const _ = require('lodash');
const searchBuilder = require('@lib/search-builder');

// const checkForSlashSlash = (key) => {
//     let i = key.indexOf('/');
//     // let i = key.indexOf('\\');
//     if(i > 0){

//     }
// }

const parseFilterQuery = (queryString) => {
  try {
    const search = new searchBuilder(queryString);
    const whereQuery = search.getWhereQuery(),
      orderQuery = search.getOrderQuery(),
      limitQuery = search.getLimitQuery(),
      offsetQuery = search.getOffsetQuery();
    return {
      whereQuery,
      orderQuery,
      limitQuery,
      offsetQuery,
    };
  } catch (error) {
    console.log(error);
  }
  return undefined;
};

module.exports = (req, res, next) => {
  const a = _.has(req, 'swagger.operation.x-filter');
  const b = _.has(req, 'query.filter');
  const c = _.has(req, 'query.order');

  if (!(a && (b || c))) {
    return next();
  }

  req.search = undefined;
  const filter = _.get(req, 'query.filter', undefined);
  const order = _.get(req, 'query.order', undefined);

  let search = '';
  if (!_.isUndefined(filter)) {
    search = filter;
  }
  if (!_.isUndefined(order)) {
    search = search.length > 0 ? search + '&' + order : order;
  }

  if (!_.isEmpty(search)) {
    const result = parseFilterQuery(search);
    req.query.search = result;
  }
  return next();
};
