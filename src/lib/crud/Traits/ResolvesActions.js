'use strict';

const ActionCollection = require('./../Collections/ActionCollection');

module.exports = class {
  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [];
  }

  /**
   * Get collection of actions.
   *
   * @return {any}
   */
  actionCollection() {
    return new ActionCollection(this.actions());
  }
};
