//@ts-check
'use strict';

const _ = require('lodash');
const ActionNotFound = require('./Exceptions/ActionNotFound');
const ModelNotFound = require('./Exceptions/ModelNotFound');
const ResourceNotFound = require('./Exceptions/ResourceNotFound');
const { throwUnless } = require('@utils/helpers');
const { URLSearchParams, URL } = require('url');

module.exports = class Request {
  /**
   * Preapre field for json.
   *
   * @return {Object}
   */
  apply(app, resources) {
    /**
     *
     * @param {string} query
     * @param {(arg0: URLSearchParams) => {}} callback
     * @returns
     */
    app.request.getOrParseQueryString = function (query, callback) {
      return query ? callback(new URLSearchParams(query)) : {};
    };

    /**
     * Get the request full url address.
     *
     * @returns {string}
     */
    app.request.fullUrl = function () {
      return (
        this.protocol +
        '://' +
        this.get('host') +
        this.url.slice(0, this.url.indexOf('?'))
      );
    };

    /**
     * Parse the incoming request url.
     *
     * @returns {Object}
     */
    app.request.parseUrl = function () {
      return new URL(this.url, `${this.protocol}://${this.get('host')}`);
    };

    /**
     *  Check if the given key exists on the request body.
     *
     * @param {String} key
     * @returns {boolean}
     */
    app.request.has = function (key) {
      return _.has(this.body, key);
    };

    /**
     *  Check if the request has file for the given key.
     *
     * @param {String} key
     * @returns {boolean}
     */
    app.request.hasFile = function (key) {
      return _.has(this.files, key);
    };

    /**
     *  Check if filters exists for the given key.
     *
     * @param {String} key
     * @returns {boolean}
     */
    app.request.hasFilter = function (key) {
      return _.has(this.filters(), key);
    };

    /**
     *  Get filter for the given key.
     *
     * @param {String} key
     * @returns {Object}
     */
    app.request.filter = function (key) {
      return _.get(this.filters(), key, {});
    };

    /**
     * Get filters from request by the query string.
     *
     * @returns {{value: any, operator: string}}
     */
    app.request.filters = function () {
      return this.getOrParseQueryString(
        encodeURI(this.queryString('filter', '')),
        (params) => {
          const filters = {};
          const accumulatives = [
            'between',
            'in',
            'notBetween',
            'notIn',
            'not',
            'is',
            'eq',
            '=',
            '<>',
            '!=',
          ];

          params.forEach((value, key) => {
            const filterValue = this.parseFilter(value);
            // to remove filter string from filter[key]=search
            const [path, operator] = key
              .match(/[^[\]]+/g)
              .filter((matched) => matched !== 'filter');

            const filter = ['between', 'notBetween'].includes(operator)
              ? {
                  value: [...(filters[path]?.value ?? []), filterValue],
                  operator,
                }
              : {
                  value: filterValue,
                  operator:
                    Array.isArray(filterValue) &&
                    !accumulatives.includes(operator)
                      ? 'in'
                      : operator ?? '=',
                };

            _.set(filters, path.replace('.', '.value.'), filter);
            filters[path] = filter;
          });

          return filters;
        },
      );
    };

    /**
     *  Check if order exists for the given key.
     *
     * @param {String} key
     * @returns {boolean}
     */
    app.request.hasOrder = function (key) {
      return _.has(this.orders(), key);
    };

    /**
     *  Get order for the given key.
     *
     * @param {String} key
     * @returns {Object}
     */
    app.request.order = function (key) {
      return _.get(this.orders(), key);
    };

    /**
     * Get orders from request by the query string.
     *
     * @returns {Object}
     */
    app.request.orders = function () {
      return this.getOrParseQueryString(
        this.queryString('order', ''),
        (params) => {
          const orders = {};

          params.forEach((direction, key) => {
            // to remove order string from order[key]=direction
            const order = key.match(/[^[\]]+/g).pop();

            orders[order] = { order, direction };
          });

          return orders;
        },
      );
    };

    /**
     * Check if the given key exists in request and is filled.
     *
     * @param {string} key
     * @returns {Boolean}
     */
    app.request.filled = function (key) {
      const value = this.input(key);

      return this.has(key) && !['', null].includes(value);
    };

    /**
     * Get all values from reqeust body and query string.
     *
     * @return {Object}
     */
    app.request.all = function (files = false) {
      const body = this.body;

      if (files !== true) {
        for (const key in this.files)
          if (Object.hasOwnProperty.call(body, key)) delete body[key];
      }

      this.parseUrl().searchParams.forEach((value, key) => (body[key] = value));

      return body;
    };

    /**
     * Merge given values into request body.
     *
     * @param {String|Object} key
     * @param {any} value
     * @return {ThisType}
     */
    app.request.merge = function (key, value = null) {
      if (typeof key == 'string') {
        key = { [key]: value };
      }

      this.body = Object.assign(this.body, key);

      return this;
    };

    /**
     * Get value from reqeust body and query string for the given key.
     *
     * @param {string} key
     * @param {any} defaultValue
     * @return {any}
     */
    app.request.input = function (key, defaultValue = null) {
      return _.get(this.body, key, this.queryString(key, defaultValue));
    };

    /**
     * Get value from query string for the given key.
     *
     * @param {string} key
     * @param {any} defaultValue
     * @return {any}
     */
    app.request.queryString = function (key, defaultValue = null) {
      return this.parseUrl().searchParams.get(key) ?? defaultValue;
    };

    /**
     * Get uploaded file from reqeust body by the given key.
     *
     * @param {string} key
     * @param {any} defaultValue
     * @return {any}
     */
    app.request.file = function (key, defaultValue = null) {
      return _.get(this.files, key, defaultValue);
    };

    /**
     * Get swagger route parameter for the given key.
     *
     * @param {string} key
     * @param {any} defaultValue
     * @return {String}
     */
    app.request.route = function (key, defaultValue = null) {
      return _.get(this.swagger, `params.${key}.value`, defaultValue);
    };

    /**
     * Create resource instance for incoming request.
     *
     * @param {number} resourceId
     * @return {Promise<Object>}
     * @throws {ModelNotFound}
     */
    app.request.findResourceOrFail = async function (resourceId = null) {
      const model = await this.findModelOrFail(resourceId);

      return this.newResource(model);
    };

    /**
     * Find model for incoming request.
     *
     * @param {number} resourceId
     * @return {Promise<Object>}
     * @throws {ModelNotFound}
     */
    app.request.findModelOrFail = async function (resourceId = null) {
      return await this.findModel(resourceId).then((model) => {
        throwUnless(
          model,
          ModelNotFound,
          this.resource(),
          resourceId ?? this.resourceId(),
        );

        return model;
      });
    };

    /**
     * Find model for incoming request.
     *
     * @param {number} resourceId
     * @return {Promise<Object>}
     */
    app.request.findModel = async function (resourceId) {
      const resource = this.resource();
      const query = await resource.buildDetailQuery(this, {});

      return await resource
        .newModel()
        .constructor.findByPk(resourceId ?? this.resourceId(), query);
    };

    /**
     * Find resource for incoming request.
     *
     * @param {string} resourceName
     * @return {Object}
     * @throws {ResourceNotFound}
     */
    app.request.resource = function (resourceName = null) {
      if (!resourceName) resourceName = this.resourceName();

      const resource = resources.find(
        (resource) => resource.uriKey() === resourceName,
      );

      throwUnless(resource, ResourceNotFound, resourceName);

      return resource;
    };

    app.request.resourceName = function () {
      return this.swaggerOperation('x-resource-name');
    };

    app.request.actionName = function () {
      return this.swaggerOperation('x-action-name');
    };

    app.request.scopeName = function () {
      return this.swaggerOperation('x-scope-name');
    };

    app.request.swaggerOperation = function (key) {
      return this.swagger?.operation?.[key];
    };

    /**
     * Get resourceId for incoming request.
     *
     * @return {?Number}
     */
    app.request.resourceId = function () {
      return this.route('id');
    };

    /**
     * Create new resource instance for incoming request.
     *
     * @param {Object} model
     * @return {Object}
     * @throws {ResourceNotFound}
     */
    app.request.newResource = function (model = null) {
      const resource = this.resource();

      return new resource.constructor(model);
    };

    /**
     * Create new resource instance for incoming request.
     *
     * @param {?Number} resourceId
     * @return {Promise<Object>}
     * @throws {ResourceNotFound}
     */
    app.request.findResource = async function (resourceId = null) {
      return this.newResource(await this.findModel(resourceId));
    };

    /**
     * Find action for incoming request.
     *
     * @return {Object}
     * @throws {ActionNotFound}
     */
    app.request.action = function () {
      const action = this.resource()
        .actionCollection()
        .all()
        .find((action) => action.uriKey() === this.actionName());

      throwUnless(action, ActionNotFound, this.actionName());

      return action;
    };

    /**
     * Find scope for incoming request.
     *
     * @return {Object}
     * @throws {ActionNotFound}
     */
    app.request.scope = function () {
      const scope = this.resource()
        .scopeCollection()
        .all()
        .find((scope) => scope.uriKey() === this.scopeName());

      throwUnless(scope, ActionNotFound, this.scopeName());

      return scope;
    };

    /**
     * Get real value for given filter
     *
     * @param {string} value
     * @return {any}
     */
    app.request.parseFilter = function (value) {
      if (value.trim() === 'null') {
        return null;
      }
      // check array pattern
      const matches = value.trim().match(/\[(.+)\]/);

      return matches === null ? value : matches[1].split(',');
    };

    /**
     * Check if the request is resource request.
     *
     * @return {Boolean}
     */
    app.request.isResourceRequest = function () {
      return /Resource(Store|Index|Detail|Scope|Action|Delete|Update)Controller/.test(
        String(this.swagger?.operation?.['x-swagger-router-controller']),
      );
    };

    /**
     * Check if the request is action resource request.
     *
     * @return {Boolean}
     */
    app.request.isResourceActionRequest = function () {
      const controller =
        this.swagger?.operation?.['x-swagger-router-controller'];

      return 'ResourceActionController' === String(controller);
    };

    /**
     * Check if the request is index resource request.
     *
     * @return {Boolean}
     */
    app.request.isResourceIndexRequest = function () {
      return this.isMethod('get') && this.resourceId() === null;
    };

    /**
     * Check if the request is show resource request.
     *
     * @return {Boolean}
     */
    app.request.isResourceDetailRequest = function () {
      return this.isMethod('get') && this.resourceId() !== null;
    };

    /**
     * Check if the request is create resource request.
     *
     * @return {Boolean}
     */
    app.request.isResourceCreateRequest = function () {
      return this.isMethod('post');
    };

    /**
     * Check if the request is update resource request.
     *
     * @return {Boolean}
     */
    app.request.isResourceUpdateRequest = function () {
      return this.isMethod('put') && this.resourceId() !== null;
    };

    /**
     * Check if the request is delete resource request.
     *
     * @return {Boolean}
     */
    app.request.isResourceDeleteRequest = function () {
      return this.isMethod('delete') && this.resourceId() !== null;
    };

    /**
     * Check if the request method is of specified type.
     *
     * @param {String} method
     * @return {Boolean}
     */
    app.request.isMethod = function (method) {
      return String(this.method).toLowerCase() === method.toLowerCase();
    };
    app.request.userId = function (method) {
      return this.user.id;
    };
  }
};
