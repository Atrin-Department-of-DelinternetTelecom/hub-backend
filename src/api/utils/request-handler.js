/* eslint-disable you-dont-need-lodash-underscore/omit */
'use strict';
const {
  respondSuccessWithPagination,
  respondInternalServerError,
  respondSuccess,
  respondBadRequest,
} = require('./response');
const { Op } = require('sequelize');
const deepmerge = require('deepmerge');
const { respondNotFound, respondOK, respondCreated } = require('./response');
const { modelToJson } = require('./tools');
const { allModels } = require('@models');
const _ = require('lodash');
const { when } = require('@utils/helpers');

const readOnlyFields = [
  'id',
  'uid',
  'creationDate',
  'createdAt',
  'updateDate',
  'updatedAt',
  'deletedAt',
];

exports.findAllEntities = async (
  query,
  model,
  customWhere,
  customInclude,
  options = {},
) => {
  const { offset, limit, include } = query;

  let q = {
    offset,
    limit,
  };

  q.where = customWhere ?? {};

  q = getKeyQuery(query, 'search.whereQuery', q, 'where');

  q = getKeyQuery(query, 'search.orderQuery', q, 'order');

  const { includes, where } = getWhereInclude(
    q.where,
    include !== true ? {} : model,
    include !== false ? customInclude : undefined,
  );

  if (includes && includes.length > 0) q.include = includes;
  if (where != undefined && Reflect.ownKeys(where).length > 0) {
    q.where = where;
  } else {
    delete q.where;
  }

  // apply native search query
  q.where = await applySearchQueries(model, q.where, query);
  // apply native ordering query
  q.order = await applyOrderQueries(model, q.order, query);

  q.distinct = true;

  // q.subQuery = true;

  const entities = await model.findAndCountAll({
    ...q,
    ...options,
  });

  if (Array.isArray(entities.count)) {
    entities.count = entities.count.length;
  }

  return entities;
};

/**
 *
 * @param {*} query
 * @param {typeof import('@models').AnyModel} model
 * @param {import('sequelize').WhereOptions} customWhere
 * @param {import('sequelize').Includeable | import('sequelize').Includeable[]} customInclude
 * @param {import('sequelize').FindOptions} options
 * @returns
 */
exports.getAllEntities = async (
  query,
  model,
  customWhere = {},
  customInclude = [],
  options = {},
) => {
  const { page, size } = query;

  const entities = await exports.findAllEntities(
    query,
    model,
    customWhere,
    customInclude,
    options,
  );

  return respondSuccessWithPagination(
    entities.rows,
    entities.count,
    size,
    page,
    query.url,
  );
};

const applySearchQueries = async (
  model,
  wheres,
  requestQuery,
  condition = undefined,
) => {
  const whereKeys = _.castArray(Reflect.ownKeys(wheres ?? {}));
  const mergedWhere = [];

  for (const whereKey of whereKeys) {
    if (isAndOr(whereKey)) {
      wheres[whereKey] = await applySearchQueries(
        model,
        wheres[whereKey],
        requestQuery,
        whereKey,
      );

      continue;
    }

    const applied = await applySearchQuery(
      model,
      whereKey,
      wheres[whereKey],
      requestQuery,
    );

    if (!applied) continue;

    mergedWhere.push({
      [applied.key]: applied.where,
    });

    delete wheres[whereKey];
    // statement
  }

  if (mergedWhere.length > 0) {
    wheres[condition ?? Op.and] = mergedWhere;
  }

  return wheres ?? {};
};

const applySearchQuery = async function (
  model,
  searchKey,
  searchValue,
  requestQuery,
) {
  const searchCallback = _.camelCase(_.snakeCase(`search_${searchKey}`));
  const { searchString, operator } = _parseSearchValue(searchValue);

  if (typeof model[searchCallback] === 'function') {
    return await model[searchCallback](searchString, operator, requestQuery);
  }
};

const _parseSearchValue = (searchValue) => {
  if (!_.isObject(searchValue)) {
    searchValue = {
      [Op.eq]: searchValue,
    };
  }

  const operator = Reflect.ownKeys(searchValue)[0];
  const searchString = searchValue[operator];

  return { operator, searchString };
};

/**
 * merge where and includes of
 * a single model
 * model associations will be replaced
 * with the the
 * @param {Object} where
 * @param {SequelizeModel} model
 * @param {Array} custom_include
 * @returns
 */
const getWhereInclude = (where, model, custom_include = undefined) => {
  //sometimes custom include will be passed as object
  //here we will convert it to the array and pass down
  //like hrms-users getAllEntities that will be passed as object
  if (!_.isUndefined(custom_include) && !_.isArray(custom_include)) {
    custom_include = [custom_include];
  }
  const finalIncludes = mergeIncludes(getInclude(model), custom_include || []);
  const new_where = getWhere(where);
  const merge = mergeWhereInclude(new_where, finalIncludes);
  return merge;
};

/**
 * Merge two includes by property
 * @param {Array} allIncludes
 * @param {Array} customIncludes
 */
const mergeIncludes = (allIncludes, customIncludes = []) => {
  if (customIncludes.length <= 0) {
    // without custom includes
    return allIncludes;
  }

  if (allIncludes.length <= 0) {
    // only custom includes
    return customIncludes;
  }

  // merge the model includes with custom includes
  const finalIncludes = [];
  for (let i = 0; i < allIncludes.length; i++) {
    const includeEle = allIncludes[i];
    const customEle = customIncludes.find(({ model, as }) => {
      return as ? includeEle.as === as : includeEle.model === model;
    });
    if (customEle != undefined) {
      finalIncludes.push(customEle);
    } else finalIncludes.push(includeEle);
  }
  return finalIncludes;
};

/**
 * Get list of associations of a
 * single model that will be returned
 * from a sequelize model
 *
 * @param {SequelizeModel} model
 * @returns
 */
const getInclude = (model) => {
  if (!_.has(model, 'associations')) {
    return [];
  }
  const associs = _.get(model, 'associations');
  // let seq = model.sequelize;
  return _.map(associs, (value, key) => {
    return {
      required: false,
      as: value.as,
      model: allModels[value.target.name],
    };
  });
};

/**
 * if key is type of string
 * and a pattern like following
 * $parent.child$ then will be
 * converted to a pattern like
 * {
 *  parent: child
 * }
 * and then will be returned
 *
 * @param {Object} where
 * @param {String} key
 * @param {Object} value
 * @returns
 */
const sliceDotedString = (where, key, value) => {
  const new_key = key.slice(1, -1);
  const keys = new_key.split('.');
  if (!where[keys[0]]) where[keys[0]] = {};
  where[keys[0]][keys[1]] = value;
  return where;
};

/**
 * Check if a key is symbol or string
 *
 * @param {Symbol|String} key
 * @returns boolean
 */
const isAndOr = (key) => {
  return key.toString() === 'Symbol(and)' || key.toString() === 'Symbol(or)';
};

/**
 * Object contains dotted keys
 * like owners.firstname
 * and owners.lastname
 * then the owners string
 * will be return as parent
 *
 * we suppose that only one property
 * exist as parent - for more we have to
 * check samples at first
 * @param {Object} value
 */
const getParents = (value) => {
  const keys = Reflect.ownKeys(value);
  const parents = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key.toString().indexOf('.') > 0) {
      const new_key = key.slice(1, -1);
      const keys = new_key.split('.');
      parents.push(keys[0]);
    }
  }
  return _.uniq(parents);
};

/**
 * parse the value and get parent of value
 * that will be replaced as parent key
 *
 * @param {String|Symbol} key
 * @param {Object} value
 */
const handleOrAnd = (key, value) => {
  const parents = getParents(value);
  const new_where = getWhere(value);

  if (parents.length > 0) {
    const array_where = new_where[parents[0]];
    return {
      [parents[0]]: {
        [key]: array_where,
      },
    };
  }
  return {
    [key]: new_where,
  };
};

/**
 * Generate where from passed string of where
 * convert and or where keys to children item of where
 * and then split nested where that anotated with dot(.)
 * and $ sign
 * @param {Object} where
 * @returns
 */
const getWhere = (where = {}) => {
  let new_where = {};
  const keys = Reflect.ownKeys(where);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = where[key];
    if (isAndOr(key)) {
      new_where = { ...new_where, ...handleOrAnd(key, value) };
    } else if (key.indexOf('.') === -1) new_where[key] = value;
    else {
      new_where = sliceDotedString(new_where, key, value);
    }
  }
  return new_where;
};

/**
 * Merge two objects - contains includes and where
 * where will be merge with customInlcludes where
 * query and priority is the where of customInclude
 * if there are same keys in both where objects
 * includ associations
 * @param {*} where
 * @param {*} includes
 * @returns
 */
const mergeWhereInclude = (where, includes, modelIncludes) => {
  if (
    !includes ||
    includes.length <= 0 ||
    !where ||
    _.keys(where).length <= 0
  ) {
    return {
      includes,
      where,
    };
  }

  _.map(includes, (inc) => {
    if (_.has(where, inc.as)) {
      const findWhere = _.get(where, inc.as);
      inc.where = deepmerge(findWhere, inc.where || {});
      inc.required = true;
      delete where[inc.as];
    }
  });
  return {
    includes,
    where,
  };
};

const getKeyQuery = (query, key, q, qKey) => {
  if (
    _.has(query, key) &&
    !_.isNull(_.get(query, key)) &&
    !_.isUndefined(_.get(query, key))
  ) {
    const newQuery = _.get(query, key);
    q[qKey] = when(
      q[qKey],
      () => {
        return qKey === 'order'
          ? q[qKey].push(newQuery)
          : { ...q[qKey], ...newQuery };
      },
      () => {
        return qKey === 'order' ? [].concat(newQuery) : newQuery;
      },
    );
  }
  return q;
};

exports.findAndGet = async (
  id,
  model,
  include,
  raw = false,
  getModel = false,
) => {
  const q = {
    where: {
      id: id,
    },
    include: include ?? {
      all: true,
      required: false,
    },
  };

  let found = await model.findOne(q);
  if (found !== null) {
    if (raw) {
      found = modelToJson(found);
    }
    if (getModel) return found;
    return respondSuccess(found);
  }
  return respondNotFound(`${model.name} with id:${id} was not found`);
};

exports.findAndDelete = async (id, model) => {
  const instance = await model.findByPk(id);
  if (instance !== null) {
    try {
      await instance.destroy();
      return respondOK(`${model.name} with id:${id} has been deleted`);
    } catch (e) {
      return respondInternalServerError(`${model.name} - ${e.toString()}`);
    }
  }
  return respondNotFound(`${model.name} with id:${id} was not found`);
};

exports.findAndDeleteIntranet = async (id, model) => {
  const found = await model.findByPk(id);
  if (found === null) {
    return respondNotFound(`${model.name} with id:${id} was not found`);
  }

  try {
    await model.update(
      {
        status: 0,
      },
      {
        where: {
          id,
        },
      },
    );
  } catch (error) {
    return handleError(error);
  }

  return respondOK(`${model.name} with id:${id} has been deleted`);
};

/**
 *
 * @param {*} id
 * @param {*} body
 * @param {typeof import('@models').AnyModel} model
 * @returns
 */
exports.findAndUpdate = async (id, body, model) => {
  return exports.findAndUpdateNoInclude(id, body, model);
};

exports.findAndUpdateNoInclude = async (id, body, model) => {
  const found = await model.findByPk(id);
  if (!found)
    return respondNotFound(`${model.name} with id:${id} was not found`);

  try {
    await found.update(_.omit(body, readOnlyFields));
    return await exports.findAndGet(id, model, []);
  } catch (error) {
    return handleError(error);
  }
};

exports.createCatch = async (data, model) => {
  try {
    return respondCreated(await model.create(data));
  } catch (error) {
    return handleError(error);
  }
};

const handleError = (error) => {
  if (
    error.name === 'SequelizeValidationError' ||
    error.name === 'SequelizeUniqueConstraintError'
  ) {
    const messages = error.errors.map((e) => e.message);

    return respondBadRequest(messages[0] ?? 'Validation Error', {
      msg: messages,
    });
  }
  return respondInternalServerError(error.message);
};

exports.getAllFromArray = (query, array) => {
  const { offset, limit, page, size } = query;
  let result = array;

  let q = {
    offset,
    limit,
  };

  q = getKeyQuery(query, 'search.whereQuery', q, 'where');

  q = getKeyQuery(query, 'search.orderQuery', q, 'order');

  const filters = [];

  if (q.where) {
    for (const key in q.where) {
      const v = q.where[key];
      if (v[Op.like]) {
        const expected = v[Op.like].slice(1, -1);

        filters.push((obj) => {
          const value = obj[key];
          if (!value) return false;
          return value.includes(expected);
        });
      }
    }
  }

  for (const filter of filters) {
    result = result.filter(filter);
  }

  const totals = result.length;
  result = result.slice(offset, offset + limit);

  return respondSuccessWithPagination(result, totals, size, page, query.url);
};

const applyOrderQueries = async (model, orders, requestQuery) => {
  return Promise.all(
    (orders ?? []).map((order) => {
      const [column, direction] = Array.isArray(order) ? order : [order, 'asc'];
      const orderCallback = _.camelCase(_.snakeCase(`order_by_${column}`));

      if (typeof model[orderCallback] !== 'function') {
        return order;
      }

      return model[orderCallback](column, direction, requestQuery);
    }),
  );
};
