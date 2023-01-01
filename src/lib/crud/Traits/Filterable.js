'use strict';
const { Op } = require('sequelize');

module.exports = class Filterable {
  /**
   * Filter aplly callback.
   *
   * @type {function}
   */
  filterCallback;

  /**
   * The filter request attribute.
   *
   * @type {string}
   */
  filterAttribute;

  /**
   * Apply filter to the query.
   *
   * @param {any} req
   * @param {Object} query
   * @return {Object}
   */
  filter(req, query = {}) {
    return req.hasFilter(this.filterKey())
      ? this.applyFilter(req, query)
      : query;
  }

  /**
   * Apply filter to the query.
   *
   * @param {any} req
   * @param {Object} query
   * @return {Object}
   */
  applyFilter(req, query = {}) {
    const mergeCondition = req.filter('_condition').value ?? 'and';
    const { value, operator } = req.filter(this.filterKey());
    const params = {
      req,
      query,
      value,
      operator,
      mergeCondition,
    };
    const filterCallback =
      typeof this.filterCallback === 'function'
        ? this.filterCallback
        : this.applyFilterFromRequest;

    return this.mergeQueries(
      query,
      filterCallback.apply(this, Object.values(params)),
      mergeCondition,
    );
  }

  /**
   * Merge given where into the global queries.
   *
   * @param {Objecy} query
   * @param {Objecy} where
   * @param {String} mergeCondition
   * @return {Object}
   */
  mergeQueries(query, where, mergeCondition = 'and') {
    if (typeof where !== 'object') return query;

    const wheres = query.where ?? {};
    const symbol = this.guessSequelizeOperator(mergeCondition);

    wheres[symbol] = wheres[symbol] ?? [];
    wheres[symbol].push(where);
    query.where = wheres;

    return query;
  }

  /**
   * Apply filter to the query.
   *
   * @param {any} req
   * @param {Object} query
   * @param {Object} value
   * @param {String} operator
   * @return {Object}
   */
  applyFilterFromRequest(req, query, value, operator = '=') {
    return {
      [this.filterKey()]: {
        [this.guessSequelizeOperator(operator)]: value,
      },
    };
  }

  /**
   * Get the sequelize equivalent operator.
   *
   * @param {String} operator
   * @return {any}
   */
  guessSequelizeOperator(operator) {
    return Op[this.mapMathematicalOperators(operator)] ?? Op.eq;
  }

  /**
   * Get string equivalent operator of symbols.
   *
   * @param {String} operator
   * @return {any}
   */
  mapMathematicalOperators(operator) {
    const operators = {
      '=': 'eq',
      '!=': 'ne',
      '>': 'gt',
      '>=': 'gte',
      '<': 'lt',
      '<=': 'lte',
      '<>': 'not',
    };

    return operators[operator] ?? operator;
  }

  /**
   * Determine that field is filterable.
   *
   * @param  {(req, query, value, operator, mergeCondition) => {} | Boolean} filterable
   * @return {this}
   */
  filterable(filterable = true) {
    if (typeof filterable === 'function') {
      this.filterable();
      this.filterUsing(filterable);
    } else {
      this.withMeta('filterable', filterable);
    }

    return this;
  }

  /**
   * Check if the field is filterable.
   *
   * @return {Boolean}
   */
  isFilterable(req) {
    return this.meta('filterable') === true && req.hasFilter(this.filterKey());
  }

  /**
   * Get key name of filter.
   *
   * @return {string}
   */
  filterKey() {
    return this.filterAttribute ?? this.attribute;
  }

  /**
   * Get key name of filter.
   *
   * @return {string}
   */
  withFilterKey(filterAttribute) {
    this.filterAttribute = filterAttribute;

    return this;
  }

  /**
   * Set the filter callback.
   *
   * @param {function} filterCallback
   * @return {this}
   */
  filterUsing(filterCallback) {
    this.filterCallback = filterCallback;

    return this;
  }
};
