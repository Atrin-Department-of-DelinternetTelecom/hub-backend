//@ts-check
'use strict';
const GfContractHolderChangeFields = require('../fields/GfContractHolderChange');
const {
  intranet: { GfClient, GfContract },
  system: { Document },
} = require('@models');
const Scope = require('@lib/crud/Scope');

module.exports = class WithDocumentHolderChanges extends Scope {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Object} query
   * @return {Object}
   */
  query(request, query) {
    query.include = [
      { model: GfClient, as: 'toClient' },
      { model: GfClient, as: 'fromClient' },
      { model: Document, as: 'document', required: true },
      { model: GfContract, as: 'contract', required: false },
    ];

    return query;
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array}
   */
  fields(request) {
    return new GfContractHolderChangeFields().fields(request);
  }
};
