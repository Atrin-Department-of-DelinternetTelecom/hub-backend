'use strict';

const Field = require('./Enum');

module.exports = class Select extends Field {
  /**
   * The multiple state.
   * @type {Boolean}
   */
  #multiple = false;

  /**
   * Determine if user can select multiple items.
   *
   * @type {Boolean}
   * @return {this}
   */
  multiple(multiple = true) {
    this.#multiple = multiple;

    return this;
  }

  /**
   * Detectthat is multiple select.
   *
   * @return {Boolean}
   */
  isMultiple() {
    return this.#multiple === true;
  }

  /**
   * Preapre field for json.
   *
   * @return {Object}
   */
  jsonSerialize() {
    return {
      ...super.jsonSerialize(),
      multiple: this.isMultiple(),
    };
  }
};
