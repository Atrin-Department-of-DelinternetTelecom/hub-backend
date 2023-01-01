//@ts-check
'use strict';

const SuspendingActionReasonFields = require('./fields/SuspendingActionReason');
const Resource = require('@lib/crud/Resource');
const { system } = require('@models');

module.exports = class SuspendingActionReason extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    { model: system.SuspendingAction, required: false },
    { model: system.SuspendingReason, required: false },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new SuspendingActionReasonFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.SuspendingActionReason;
  }
};
