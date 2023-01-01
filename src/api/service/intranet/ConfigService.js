'use strict';

const { CrmConfig, GfConfig, InvoiceConfig } = require('@models').intranet;

const { findAndUpdate } = require('@utils/request-handler');

const { respondSuccess, respondNotFound } = require('../../utils/response');

exports.get = async (app, key) => {
  let config;
  switch (app) {
    case 'goufone':
      config = GfConfig;
      break;
    case 'crm':
      config = CrmConfig;
      break;
    case 'invoice':
      config = InvoiceConfig;
      break;
  }

  const appConfigs = await config.findOne({
    where: {
      uid: 90,
      status: 1,
    },
  });
  return appConfigs[key];
};

exports._mockGet = async (fn) => {
  exports.get = fn;
};

/**
 * Your GET endpoint
 * get all FeeGroup labels(information) record
 *
 * returns Object
 **/
exports.getGfConfigs = async function () {
  const gfConfig = await GfConfig.findOne();
  if (!gfConfig) {
    return respondNotFound('config not found');
  }

  const { invoiceDay, invoiceMonths, invoiceSerieId } = gfConfig.get({
    plain: true,
  });
  return respondSuccess({ invoiceDay, invoiceMonths, invoiceSerieId });
};

/**
 * Your GET endpoint
 * update single FeeGroup lable record by id
 *
 * returns Object
 **/
exports.updateGfConfig = async function (body) {
  const gfConfig = await GfConfig.findOne();
  if (!gfConfig) {
    return respondNotFound('config not found');
  }

  return findAndUpdate(gfConfig.id, body, GfConfig);
};
