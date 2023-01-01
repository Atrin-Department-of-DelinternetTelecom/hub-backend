//@ts-check
'use strict';
const GfBonoLabelFields = require('./fields/GfBonoLabel');
const { GfBonoLabel: GfBonoLabelModel } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfBonoLabel extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {any[]}
   */
  fields(request) {
    return new GfBonoLabelFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GfBonoLabelModel;
  }
};
