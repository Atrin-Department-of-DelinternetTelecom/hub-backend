//@ts-check
'use strict';

const GfDocumentTypeFields = require('./fields/GfDocumentType');
const models = require('@models');
const Resource = require('@lib/crud/Resource');

module.exports = class GfDocumentType extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return new GfDocumentTypeFields().fields(request);
  }

  model() {
    return models.intranet.GfDocumentType;
  }
};
