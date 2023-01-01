//@ts-check
'use strict';
const GfBonoLabelXrefFields = require('./fields/GfBonoLabelXref');
const { GfBonoLabelXref: GfBonoLabeXreflModel } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfBonoLabelXref extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {any[]}
   */
  fields(request) {
    return new GfBonoLabelXrefFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GfBonoLabeXreflModel;
  }
};
