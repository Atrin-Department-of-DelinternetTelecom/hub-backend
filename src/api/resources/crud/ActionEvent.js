//@ts-check
'use strict';

const { ActionEvent: Model } = require('@api/models/crud/crud_action_event');
const ActionEventFields = require('./fields/ActionEvent');
const Resource = require('@lib/crud/Resource');

module.exports = class ActionEvent extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new ActionEventFields().fields(request);
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
