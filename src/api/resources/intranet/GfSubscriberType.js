//@ts-check
'use strict';

const GfSubscriberTypeFields = require('./fields/GfSubscriberType');
const models = require('@models');
const Resource = require('@lib/crud/FormData');

module.exports = class GfSubscriberType extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return new GfSubscriberTypeFields().fields(request);
  }

  model() {
    return models.intranet.GfSubscriberType;
  }
};
