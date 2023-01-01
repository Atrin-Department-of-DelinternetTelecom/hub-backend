'use strict';

const Collection = require('./Collection');

module.exports = class ActionCollection extends Collection {
  /**
   * Get standalone actions.
   *
   * @return {this}
   */
  standalone() {
    const items = this.items.filter((action) => action.isStandalone());

    return new ActionCollection(items);
  }

  /**
   * Get inline actions.
   *
   * @return {this}
   */
  inline() {
    const items = this.items.filter((action) => action.inline());

    return new ActionCollection(items);
  }
};
