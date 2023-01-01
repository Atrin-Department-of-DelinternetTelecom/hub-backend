'use strict';

const GfClientDocumentConceptFields = require('./fields/GfClientDocumentConcept');
const models = require('@models');
const Resource = require('@lib/crud/FormData');

module.exports = class GfClientDocumentConcept extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return new GfClientDocumentConceptFields().fields(request);
  }

  model() {
    return models.intranet.GfClientDocumentConcept;
  }
};
