//@ts-check
'use strict';

const { GlobalException } = require('@models').system;
const ExceptionFields = require('./fields/Exception');
const Resource = require('@lib/crud/Resource');

module.exports = class Exception extends Resource {
  /**
   * Get the uri key.
   *
   * @return string
   */
  uriKey() {
    return 'global-' + super.uriKey();
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new ExceptionFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GlobalException;
  }
};
