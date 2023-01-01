'use strict';

module.exports = class PerformsQueries {
  /**
   * Build an "index" query for the given resource.
   *
   * @param {Object} req
   * @param {Object} query
   * @return {Object}
   */
  buildIndexQuery(req, query) {
    if (!query.include) query.include = [];

    query.include = [...query.include, ...this.indexInclude()];

    // apply groupBy to query
    if (this.groupBy) query.group = `${this.model().name}.${this.groupBy}`;

    return this.indexQuery(req, query) ?? query;
  }

  /**
   * Build an "detail" query for the given resource.
   *
   * @param {Object} req
   * @param {Object} query
   * @return {Object}
   */
  buildDetailQuery(req, query) {
    if (!query.include) query.include = [];

    query.include = [...query.include, ...this.detailInclude()];

    return this.detailQuery(req, query) ?? query;
  }

  /**
   * Build a "index" query for the given resource.
   *
   * @param {any} req
   * @param {Object} query
   * @return {Object}
   */
  indexQuery(req, query = {}) {
    return query;
  }

  /**
   * Build a "detail" query for the given resource.
   *
   * @param {any} req
   * @param {Object} query
   * @return {Object}
   */
  detailQuery(req, query = {}) {
    return query;
  }
};
