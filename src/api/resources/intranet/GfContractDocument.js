//@ts-check
'use strict';
const GfContractDocumentFields = require('./fields/GfContractDocument');
const { GfClient } = require('@models').intranet;
const { GfClientDocument } = require('@models').intranet;
const { GfContract } = require('@models').intranet;
const { GfContractDocument: Model } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfContractDocument extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfContractDocumentFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}}
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
    return this.mergeIncludes(req, query);
  }

  /**
   * Prepare resource for swager config.
   *
   * @return Object
   */
  detailQuery(req, query = {}) {
    return this.mergeIncludes(req, query);
  }

  /**
   * Merge include to query.
   *
   * @param {Object} req
   * @param {Object} query
   * @returns {Object}
   *
   */
  mergeIncludes(req, query = {}) {
    query.include = [
      ...(query.include || []),
      { model: GfClient, as: 'client' },
      { model: GfClientDocument, as: 'document' },
      { model: GfContract, as: 'contract' },
    ];

    return query;
  }
};
