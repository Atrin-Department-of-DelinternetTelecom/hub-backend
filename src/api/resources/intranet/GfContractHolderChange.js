//@ts-check
'use strict';

const { GfClient } = require('@models').intranet;
const { GfContractHolderChange: Model, GfContract } =
  require('@models').intranet;
const GfContractHolderChangeFields = require('./fields/GfContractHolderChange');
const Resource = require('@lib/crud/Resource');
const {
  handle: ProcessChangeHolderRequest,
} = require('@api/service/intranet/Actions/ProcessChangeHolderRequest');
const { Document } = require('@api/models/global/global_document');
const WithDocumentHolderChanges = require('./scopes/WithDocumentHolderChanges');
const {
  handle: CancelChangeHolderRequest,
} = require('@api/service/intranet/Actions/CancelChangeHolderRequest');

module.exports = class GfContractHolderChange extends Resource {
  /**
   * Determine that need to creation API.
   *
   * @type {Boolean}
   */
  configureCreateSwagger = false;

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {[]}
   */
  fields(request) {
    return new GfContractHolderChangeFields().fields(request);
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
      { model: GfClient, as: 'toClient' },
      { model: GfClient, as: 'fromClient' },
      { model: Document, as: 'document', required: false },
      { model: GfContract, as: 'contract', required: false },
    ];

    return query;
  }

  /**
   * Dispatch saving event.
   *
   * @param {any} req
   * @param {import('@models').AnyModel} model
   */
  async saving(req, model) {
    if (model.changed('state') && model.isDone()) {
      await ProcessChangeHolderRequest(model, req.user.userId);
    }
  }

  async deleting(req, model) {
    await CancelChangeHolderRequest(model);
  }

  /**
   * Get the list of the resource scopes.
   *
   * @return {array}
   */
  scopes() {
    return [new WithDocumentHolderChanges()];
  }
};
