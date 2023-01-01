//@ts-check
'use strict';

const SuspendingReasonFields = require('./fields/SuspendingReason');
const Resource = require('@lib/crud/Resource');
const { system } = require('@models');

module.exports = class SuspendingReason extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new SuspendingReasonFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.SuspendingReason;
  }
};
