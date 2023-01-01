'use strict';
const { GfContract, GfCellProvider } = require('@models').intranet;

const GfFeeService = require('./Fee/GfFeeService');

exports.isFromAire = async function (contractId) {
  const result = await getCellProvider(contractId);

  return result.providerCode === 'aire';
};

const getCellProvider = async function (contractId, conditions) {
  const contract = await GfContract.findByPk(contractId);
  conditions =
    conditions ?? (await GfFeeService.getActualConditions(contract.feeGroupId));
  const provider = await GfCellProvider.findByPk(conditions.cellProviderId);

  if (provider)
    return {
      success: true,
      providerCode: provider.code,
    };

  // PS:
  return conditions.cellExcludeFromAire === 1
    ? { success: true, providerCode: 'lemon' }
    : { success: true, providerCode: 'aire' };
};
