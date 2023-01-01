'use strict';

const NotFound = require('./NotFound.js');

module.exports = class ScopeNotFound extends NotFound {
  /**
   * Instantiate the error class.
   *
   * @param {string} scopeName
   * @constructor
   */
  constructor(scopeName) {
    super(`Scope not found for urikey:'${scopeName}'`);
    this.name = 'ScopeNotFound';
    this.scopeName = scopeName;
  }
};
