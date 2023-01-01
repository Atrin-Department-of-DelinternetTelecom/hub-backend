'use strict';

module.exports = class HasEvents {
  /**
   * Dispatch saving event.
   *
   * @param {Object} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async saving(request, model) {}

  /**
   * Dispatch saved event.
   *
   * @param {Object} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async saved(request, model) {}

  /**
   * Dispatch creating event.
   *
   * @param {Object} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async creating(request, model) {}

  /**
   * Dispatch created event.
   *
   * @param {Object} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async created(request, model) {}

  /**
   * Dispatch updating event.
   *
   * @param {Object} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async updating(request, model) {}

  /**
   * Dispatch updated event.
   *
   * @param {Object} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async updated(request, model) {}

  /**
   * Dispatch deleting event.
   *
   * @param {Object} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async deleting(request, model) {}

  /**
   * Dispatch deleted event.
   *
   * @param {Object} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async deleted(request, model) {}
};
