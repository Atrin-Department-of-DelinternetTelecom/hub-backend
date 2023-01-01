'use strict';
const Authorizable = require('./Traits/Authorizable');
const HasEvents = require('./Traits/HasEvents');
const { Mixin } = require('ts-mixer');
const pluralize = require('pluralize');
const PerformsValidation = require('./Traits/PerformsValidation');
const PerformsQueries = require('./Traits/PerformsQueries');
const ResolvesActions = require('./Traits/ResolvesActions');
const ResolvesFields = require('./Traits/ResolvesFields');
const ResolvesScopes = require('./Traits/ResolvesScopes');
const Routable = require('./Traits/Routable');
const SwaggerResource = require('./Traits/SwaggerResource');
const { AnyModel } = require('@api/models');

module.exports = class Resource extends (
  Mixin(
    Authorizable,
    PerformsQueries,
    HasEvents,
    PerformsValidation,
    ResolvesActions,
    ResolvesFields,
    ResolvesScopes,
    Routable,
    SwaggerResource,
  )
) {
  /**
   * Resource instance
   * @type {import('@api/models').AnyModel}
   */
  resource = null;

  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [];

  /**
   * Eager loaded relation ships on index.
   *
   * @type {Array}
   */
  includeIndex = [];

  /**
   * Eager loaded relation ships on detail.
   *
   * @type {Array}
   */
  includeDetail = [];

  /**
   * The column(s) used to "group by" the "index" query.
   *
   * @type {string|Array|null}
   */
  groupBy = null;

  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {object} resource
   * @constructor
   */
  constructor(resource = null) {
    super();
    this.resource = resource;
  }

  /**
   * Get group of the resource.
   *
   * @returns {String}
   */
  group() {
    return this.uriKey();
  }

  /**
   * Get plural display name of the resource.
   *
   * @returns {String}
   */
  label() {
    return pluralize(this.name());
  }

  /**
   * Get singular display name of the resource.
   *
   * @returns {String}
   */
  singularLabel() {
    return this.name();
  }

  /**
   * Get the resource model instance.
   *
   * @returns {Object}
   */
  newModel() {
    const model = this.model();

    return new model();
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    throw new Error(`Model not found for resource:${this.name()}`);
  }

  /**
   * Get detail query includes.
   *
   * @return {Array}
   */
  detailInclude() {
    return [...this.include, ...this.includeDetail];
  }

  /**
   * Get Index query includes.
   *
   * @return {Array}
   */
  indexInclude() {
    return [...this.include, ...this.includeIndex];
  }

  /**
   * Serilize resource for detail request.
   *
   * @param {Object} request
   * @return {{attributes: Record<string, unknown>, fields: Field[], model: AnyModel}}
   */
  async serializeForDetail(request) {
    const attributes = this.resource.get({ plain: true });
    const fields = this.fieldCollection(request)
      .forDetail()
      .authorize(request)
      .all();

    await Promise.all(
      fields.map((field) => field.resolve(request, this.resource)),
    );

    fields.forEach((field) => {
      attributes[field.attribute] = field.meta('value');
    });

    return {
      attributes,
      fields,
      model: this.resource ?? this.newModel(),
    };
  }

  /**
   * Serilize resource for index request.
   *
   * @param {Object} request
   * @return {Object}
   */
  async serializeForIndex(request) {
    const attributes = this.resource.get({ plain: true });
    const fields = this.fieldCollection(request)
      .forIndex()
      .authorize(request)
      .all();

    await Promise.all(
      fields.map((field) => field.resolve(request, this.resource)),
    );

    fields.forEach((field) => {
      attributes[field.attribute] = field.meta('value');
    });

    return {
      attributes,
      fields,
      model: this.resource ?? this.newModel(),
    };
  }
};
