//@ts-check
'use strict';

const { CustomActionEvent, CustomActionEventType } = require('@models').system;
import { User } from '@models/global/global_users';
const Resource = require('@lib/crud/Resource');
const CustomActionEventFields = require('./fields/CustomActionEvent');

module.exports = class extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: CustomActionEventType,
      as: 'actionType',
      required: false,
    },
    {
      model: User,
      as: 'user',
      required: false,
    },
  ];
  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return CustomActionEvent;
  }
  uriKey() {
    return 'custom-action-events';
  }
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new CustomActionEventFields().fields(request);
  }
};
