'use strict';

const pagination = require('@utils/pagination');
const config = require('@config');
const _ = require('lodash');

const pageNumber = config.get('index.pagination.pageNumber');
const pageSize = config.get('index.pagination.pageSize');

const getInclude = (req) => {
  const include = _.get(req, 'query.include');

  if (_.isUndefined(include)) return undefined;

  if (include != '' && typeof include === 'string') {
    return include === 'true';
  }

  return typeof include === 'boolean' ? include : false;
};

module.exports = (req, res, next) => {
  if (!_.has(req, 'swagger.operation.x-pagination')) {
    return next();
  }

  const include = getInclude(req);
  let page = _.get(req, 'query.page');
  let size = _.get(req, 'query.size');
  page = page == undefined ? pageNumber : parseInt(page);
  size = size == undefined ? pageSize : parseInt(size);

  if (page <= 0) page = pageNumber;
  if (size <= 0) size = pageSize;

  const { offset, limit } = pagination.getPagination(parseInt(page), size);
  req.query.page = page;
  req.query.size = size;
  req.query.offset = offset;
  req.query.limit = limit;
  req.query.include = include;
  return next();
};
