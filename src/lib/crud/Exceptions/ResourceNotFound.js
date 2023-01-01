'use strict';

const NotFound = require('./NotFound.js');

module.exports = class ResourceNotFound extends NotFound {
  /**
   * Instantiate the error class.
   *
   * @param {string} resourceName
   * @constructor
   */
  constructor(resourceName) {
    super(`Resource not found for urikey:'${resourceName}'`);
    this.name = 'ResourceNotFound';
    this.resourceName = resourceName;
  }
};
