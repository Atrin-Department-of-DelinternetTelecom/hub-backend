'use strict';

const _ = require('lodash');
const { getAllEntities } = require('@utils/request-handler');
const GfContractService = require('./GfContractService');
const { GfCellProvider } = require('@models').intranet;

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getGfCellProviders = async function (query) {
  return await getAllEntities(query, GfCellProvider);
};

exports.getContractProvider = async function (contractId) {
  const conditions = await GfContractService.getActualConditionsBySection(
    contractId,
  );

  return parseInt(_.get(conditions, 'cellProviderId'))
    ? await GfCellProvider.findByPk(_.get(conditions, 'cellProviderId'))
    : await GfCellProvider.findOne({
        // get default provider
        where: {
          code: 'aire',
        },
      });
};
