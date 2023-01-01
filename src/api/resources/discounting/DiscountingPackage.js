//@ts-check
'use strict';
import DiscountingPackageService from '@api/service/DiscountingPackageService';
const DiscountingPackageFields = require('./fields/DiscountingPackage');
const Resource = require('@lib/crud/Resource');
const {
  system: {
    DiscountingPackage: Model,
    DiscountingPackageFee,
    DiscountingPackageClient,
    DiscountingPackageClientTag,
  },
  intranet: {
    GfFeeGroup,
    GfFeegroupsGroupLabel,
    GfClient,
    InvoiceClientsExtraField,
  },
  AnyModel,
} = require('@models');

module.exports = class DiscountingPackage extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: GfFeeGroup,
      required: false,
      through: DiscountingPackageFee,
      attributes: ['name', 'id'],
    },
    {
      model: GfClient,
      required: false,
      through: DiscountingPackageClient,
      attributes: ['name', 'id'],
    },
    {
      model: InvoiceClientsExtraField,
      required: false,
      through: DiscountingPackageClientTag,
      attributes: ['name', 'id'],
    },
    {
      model: GfFeegroupsGroupLabel,
      attributes: ['name', 'id'],
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new DiscountingPackageFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return Model;
  }

  /**
   * Dispatch created event.
   *
   * @param {Object} request
   * @param {AnyModel} model
   * @return {Promise<void>}
   */
  async created(request, model) {
    await DiscountingPackageService.createDiscount(model);
  }
};
