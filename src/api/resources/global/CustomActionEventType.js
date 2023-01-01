//@ts-check
'use strict';

const { CustomActionEventType } = require('@models').system;
const Resource = require('@lib/crud/Resource');
const CustomActionEventTypeFields = require('./fields/CustomActionEventType');

module.exports = class extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new CustomActionEventTypeFields().fields(request);
  }

  uriKey() {
    return 'custom-action-event-types';
  }
  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return CustomActionEventType;
  }
};
