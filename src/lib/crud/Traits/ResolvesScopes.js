//@ts-check
'use strict';
const ScopeCollection = require('./../Collections/ScopeCollection');

module.exports = class {
  /**
   * Get the list of the resource scopes.
   *
   * @return {array}
   */
  scopes() {
    return [];
  }

  /**
   * Get collection of scopes.
   *
   * @return {any}
   */
  scopeCollection() {
    return new ScopeCollection(this.scopes());
  }
};
