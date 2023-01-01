'use strict';

module.exports = class {
  /**
   * Run the given callback when condition is true.
   *
   * @param {boolean} condition
   * @param {function} callback
   * @return {this}
   */
  when(condition, callback) {
    if (condition) callback(this);

    return this;
  }

  /**
   * Run the given callback when condition is false.
   *
   * @param {boolean} condition
   * @param {function} callback
   * @return {this}
   */
  unless(condition, callback) {
    return this.when(!condition, callback);
  }
};
