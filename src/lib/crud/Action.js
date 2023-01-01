'use strict';

const Authorizable = require('./Traits/Authorizable');
const { Mixin } = require('ts-mixer');
const PerformsValidation = require('./Traits/PerformsValidation');
const ResolvesFields = require('./Traits/ResolvesFields');
const Routable = require('./Traits/Routable');
const SwaggerAction = require('./Traits/SwaggerAction');

module.exports = class Action extends (
  Mixin(
    Authorizable,
    PerformsValidation,
    ResolvesFields,
    Routable,
    SwaggerAction,
  )
) {
  /**
   * Determin if actions is standalone.
   *
   * @type {Boolean}
   */
  #standaloneAction = false;

  /**
   * Determin if actions is inline.
   *
   * @type {Boolean}
   */
  #inlineAction = false;

  /**
   * Determin if actions is direct.
   *
   * @type {Boolean}
   */
  #directAction = false;

  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    return Action.success();
  }

  /**
   * sned success message response.
   *
   * @return {Object}
   */
  static success() {
    return Action.message('Action ran successfully');
  }

  /**
   * sned message response.
   *
   * @param {String} message
   * @return {Object}
   */
  static message(message) {
    return { message };
  }

  /**
   * Set the action as standalone.
   *
   * @return {this}
   */
  standalone() {
    this.#standaloneAction = true;

    return this;
  }

  /**
   * Check if the action need resource to run.
   *
   * @return {Boolean}
   */
  isStandalone() {
    return this.#standaloneAction === true;
  }

  /**
   * Set the action as inline.
   *
   * @return {this}
   */
  inline() {
    this.#inlineAction = true;

    return this;
  }

  /**
   * Check if the action should be run by single resource.
   *
   * @return {Boolean}
   */
  isInline() {
    return this.#inlineAction === true;
  }

  /**
   * Set the action as direct.
   *
   * @return {this}
   */
  direct() {
    this.#directAction = true;

    return this;
  }

  /**
   * Check if the action should be run by single resource.
   *
   * @return {Boolean}
   */
  isDirect() {
    return this.#directAction === true;
  }
};
