//@ts-check
'use strict';
const AssignableHistoryFields = require('./fields/AssignableHistory');
const { AssignableHistory: Model, User } = require('@models').system;
const { GfContract } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class AssignableHistory extends Resource {
  /**
   * Eager loaded relation ships on index.
   *
   * @type {Array}
   */
  includeIndex = [
    {
      model: User,
      required: false,
    },
    {
      model: GfContract,
      required: false,
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new AssignableHistoryFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return Model;
  }
};
