//@ts-check
'use strict';
const {
  intranet: { GfDiscountsScheduled, GfContract, GfClient },
} = require('@models');
const GfDiscountScheduledFields = require('./fields/GfDiscountScheduled');
const {
  recordMovement,
  syncInvoice,
} = require('@service/intranet/GfDiscountsScheduledService');
const Resource = require('@lib/crud/Resource');
const { MOVEMENT_ACTIONS } = require('@api/constants/discount');

module.exports = class GfDiscountScheduled extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfDiscountScheduledFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GfDiscountsScheduled;
  }

  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: GfContract,
      as: 'contract',
      required: false,
      include: [
        {
          model: GfClient,
          as: 'client',
          required: false,
        },
      ],
    },
  ];

  /**
   * Get the uri key.
   *
   * @return {string}
   */
  uriKey() {
    return 'gf-discounts-scheduleds';
  }

  /**
   * Dispatch saving event.
   *
   * @param {any} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async created(request, discount) {
    await recordMovement({
      discount,
      userId: request.user.userId,
      action: MOVEMENT_ACTIONS.INSERT,
    });
  }

  /**
   * Dispatch saving event.
   *
   * @param {any} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async updated(request, discount) {
    await recordMovement({
      discount,
      userId: request.user.userId,
      action:
        !discount.changed('state') ||
        ![
          MOVEMENT_ACTIONS.APPLIED,
          MOVEMENT_ACTIONS.PARTIALLY_APPLIED,
        ].includes(discount.state)
          ? MOVEMENT_ACTIONS.UPDATE
          : discount.state,
    });
  }
  /**
   * Dispatch saving event.
   *
   * @param {any} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async saved(request, discount) {
    await syncInvoice(discount, request.user.userId);
  }
};
