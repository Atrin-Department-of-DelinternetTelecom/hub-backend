'use strict';

module.exports = class Sortable {
  /**
   * Sort aplly callback.
   *
   * @type {function}
   */
  sortCallback;

  /**
   * Apply sort to the query.
   *
   * @param {any} req
   * @param {object} query
   * @return {Object}
   */
  sort(req, query = {}) {
    return req.hasOrder(this.sortKey()) ? this.applySorting(req, query) : query;
  }

  /**
   * Apply sort to the query.
   *
   * @param {any} req
   * @param {object} query
   * @return {Object}
   */
  applySorting(req, query = {}) {
    const params = { req, query, ...req.order(this.sortKey()) };
    const sortCallback =
      typeof this.sortCallback === 'function'
        ? this.sortCallback
        : this.applySortFromRequest;

    return sortCallback.apply(this, Object.values(params)) ?? query;
  }

  /**
   * Apply sort to the query.
   *
   * @param {any} req
   * @param {object} query
   * @param {string} sort
   * @param {string} direction
   * @return {Object}
   */
  applySortFromRequest(req, query, sort, direction) {
    query.order.push([this.sortKey(), direction]);

    return query;
  }

  /**
   * Determine that field is sortable.
   *
   * @param  {Boolean|function} sortable
   * @return {this}
   */
  sortable(sortable = true) {
    if (typeof sortable === 'function') {
      this.sortable();
      this.sortUsing(sortable);
    } else {
      this.withMeta('sortable', sortable);
    }

    return this;
  }

  /**
   * Check if field is sortable.
   *
   * @param {any} req
   * @return {Boolean}
   */
  isSortable(req) {
    return this.meta('sortable') === true && req.hasOrder(this.sortKey());
  }

  /**
   * Get key name of sort.
   *
   * @return {string}
   */
  sortKey() {
    return this.attribute;
  }

  /**
   * Set the sort callback.
   *
   * @param  {function} sortCallback
   * @return {this}
   */
  sortUsing(sortCallback) {
    this.sortCallback = sortCallback;

    return this;
  }
};
