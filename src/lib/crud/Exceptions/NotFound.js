'use strict';

const CustomError = require('./CustomError.js');

module.exports = class NotFound extends CustomError {
  /**
   * Instantiate the error class.
   *
   * @param {string} actionName
   * @constructor
   */
  constructor(message) {
    super(message);
    this.name = 'NotFound';
    this.code = 404;
  }
};
