//@ts-check
'use strict';

module.exports = class CustomError extends Error {
  /**
   * Rturns a string representing the error.
   *
   * @return {String}
   */
  toString() {
    return this.message;
  }
};
