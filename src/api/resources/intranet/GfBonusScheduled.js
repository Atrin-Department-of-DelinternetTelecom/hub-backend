//@ts-check
'use strict';
const { GfBonusScheduled: Model } = require('@models').intranet;
const GfBonusScheduledFields = require('./fields/GfBonusScheduled');
const GfBonusScheduledService = require('@service/intranet/GfBonusScheduledService');
const GfBonusService = require('@service/intranet/Fee/GfBonusService');
const { GfDiscountsExecuted } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');

module.exports = class GfBonusScheduled extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfBonusScheduledFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @return {function}
   */
  model() {
    return Model;
  }

  /**
   * Dispatch saving event.
   *
   * @param {any} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async saved(request, model) {
    await GfBonusScheduledService.searchAndApplyIndate(
      model.contractId,
      request.user.userId,
    );

    await GfBonusScheduledService.searchAndApplyOutdate(
      model.contractId,
      request.user.userId,
    );
  }

  /**
   * Dispatch deleting event.
   *
   * @param {any} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async deleting(request, model) {
    await GfBonusService.removeBonus(
      model.bonusContractXrefId,
      false,
      true,
      request.user.userId,
    );
  }

  /**
   * Authorize user to Delete resource for the given request.
   *
   * @param {Object} request
   * @return {Promise<Boolean>}
   */
  async authorizedToDelete(request) {
    const authorizedToDelete = await super.authorizedToDelete(request);
    const discountExecuted = await GfDiscountsExecuted.findByPk(
      this.resource?.executedId ?? 0,
    );

    // if this schedule is part of a discount can't be detleted
    return authorizedToDelete && !discountExecuted?.isActive();
  }
};
