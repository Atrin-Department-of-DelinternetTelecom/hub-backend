//@ts-check
'use strict';
const GfDiscountMatrixFields = require('./fields/GfDiscountMatrix');
const { GfBonus } = require('@models').intranet;
const { GfDiscountsMatrix } = require('@models').intranet;
const { GfDiscountsMatrixExclusion } = require('@models').intranet;
const { GfFeegroupsGroupLabel } = require('@models').intranet;

const Resource = require('@lib/crud/Resource');

module.exports = class GfDiscountMatrix extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {any[]}
   */
  include = [
    {
      model: GfDiscountsMatrixExclusion,
      as: 'matrixExclusion',
      required: false,
      include: [
        {
          model: GfDiscountsMatrix,
          as: 'excludedMatrix',
          required: false,
        },
      ],
    },
    {
      model: GfFeegroupsGroupLabel,
      as: 'feeGroupLabels',
      required: false,
    },
  ];

  /**
   * Eager loaded relation ships on detail.
   *
   * @type {any[]}
   */
  includeDetail = [
    {
      model: GfBonus,
      as: 'bonus',
      required: false,
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {any[]}
   */
  fields(request) {
    return new GfDiscountMatrixFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GfDiscountsMatrix;
  }
};
