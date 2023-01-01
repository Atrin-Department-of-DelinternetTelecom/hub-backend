'use strict';

const NotFound = require('./NotFound.js');

module.exports = class ActionNotFound extends NotFound {
  /**
   * Instantiate the error class.
   *
   * @param {string} actionName
   * @constructor
   */
  constructor(actionName) {
    super(`Action not found for urikey:'${actionName}'`);
    this.name = 'ActionNotFound';
    this.actionName = actionName;
  }
};
