//@ts-check
'use strict';

module.exports = class {
  /**
   * Authorize user to View resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<void>}
   * @throws {Error}
   */
  async authorizeToView(request) {
    return await this.authorizeTo(request, 'view');
  }

  /**
   * Authorize user to View resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<Boolean>}
   */
  async authorizedToView(request) {
    return await this.authorizedTo(request, 'view');
  }

  /**
   * Authorize user to Create resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<void>}
   * @throws {Error}
   */
  async authorizeToCreate(request) {
    return await this.authorizeTo(request, 'create');
  }

  /**
   * Authorize user to Create resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<Boolean>}
   */
  async authorizedToCreate(request) {
    return await this.authorizedTo(request, 'create');
  }

  /**
   * Authorize user to Update resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<void>}
   * @throws {Error}
   */
  async authorizeToUpdate(request) {
    return await this.authorizeTo(request, 'update');
  }

  /**
   * Authorize user to Update resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<Boolean>}
   */
  async authorizedToUpdate(request) {
    return await this.authorizedTo(request, 'update');
  }

  /**
   * Authorize user to Delete resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<void>}
   * @throws {Error}
   */
  async authorizeToDelete(request) {
    return await this.authorizeTo(request, 'delete');
  }

  /**
   * Authorize user to Delete resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<Boolean>}
   */
  async authorizedToDelete(request) {
    return await this.authorizedTo(request, 'delete');
  }

  /**
   * Authorize user to Restore resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<void>}
   * @throws {Error}
   */
  async authorizeToRestore(request) {
    return await this.authorizeTo(request, 'restore');
  }

  /**
   * Authorize user to Restore resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<Boolean>}
   */
  async authorizedToRestore(request) {
    return await this.authorizedTo(request, 'restore');
  }

  /**
   * Authorize user to request resource for the given request.
   *
   * @param {Object} request
   * @param {String} action
   * @return {Promise<void>}
   * @throws {Error}
   */
  async authorizeTo(request, action) {
    if (!this.authorizedTo(request, action)) {
      // @ts-ignore
      throw new Error(`Unauthorized to ${action} ${this.name()}`);
    }
  }

  /**
   * Authorize user to request resource for the given request.
   *
   * @param {Object} request
   * @param {String} action
   * @return {Promise<Boolean>}
   */
  async authorizedTo(request, action) {
    return true;
  }
};
