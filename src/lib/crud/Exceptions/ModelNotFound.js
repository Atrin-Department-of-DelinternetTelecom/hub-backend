'use strict';

const NotFound = require('./NotFound.js');

module.exports = class ModelNotFound extends NotFound {
  /**
   * Instantiate the error class.
   *
   * @param {any} resource
   * @param {number} resourceId
   * @constructor
   */
  constructor(resource, resourceId) {
    super(`${resource.singularLabel()} with id:${resourceId} not found`);
    this.name = 'ModelNotFound';
    this.resource = resource;
    this.resourceId = resourceId;
  }
};
