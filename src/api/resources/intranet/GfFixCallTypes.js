//@ts-check
'use strict';
const GfFixCallTypesField = require('./fields/GfFixCallTypes');
const { GfFixCallTypes: Model, GfPhonePrefix } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfFixCallTypes extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfFixCallTypesField().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return Model;
  }

  /**
   * Prepare resource for swager config.
   *
   * @return Object
   */
  indexQuery(req, query = {}) {
    query.include = [
      ...(query.include ?? []),
      {
        model: GfPhonePrefix,
        as: 'prefixes',
        required: false,
      },
    ];

    return query;
  }

  /**
   * Prepare resource for swager config.
   *
   * @return Object
   */
  detailQuery(req, query = {}) {
    query.include = [
      ...(query.include ?? []),
      {
        model: GfPhonePrefix,
        as: 'prefixes',
        required: false,
      },
    ];

    return query;
  }
};
