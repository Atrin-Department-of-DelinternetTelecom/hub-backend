//@ts-check
'use strict';
const Authorizable = require('./Traits/Authorizable');
const { Mixin } = require('ts-mixer');
const ResolvesActions = require('./Traits/ResolvesActions');
const ResolvesFields = require('./Traits/ResolvesFields');
const Routable = require('./Traits/Routable');
const SwaggerScope = require('./Traits/SwaggerScope');

module.exports = class Scope extends (
  Mixin(Authorizable, ResolvesActions, ResolvesFields, Routable, SwaggerScope)
) {
  /**
   * Resource instance
   * @type {object}
   */
  resource = null;

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
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Object} query
   * @return {Object}
   */
  query(request, query) {
    return query;
  }

  /**
   * Serialize resource for index request.
   *
   * @param {Object} request
   * @return {Promise<Object>}
   */
  async serializeForIndex(request) {
    const fields = this.fieldCollection(request)
      .forIndex()
      .authorize(request)
      .all();

    await Promise.all(
      fields.map((field) => field.resolve(request, this.resource)),
    );

    return {
      fields,
      model: this.resource,
      attributes: fields.reduce((attributes, field) => {
        attributes[field.attribute] = field.meta('value');

        return attributes;
      }, this.resource.get({ plain: true })),
    };
  }
};
