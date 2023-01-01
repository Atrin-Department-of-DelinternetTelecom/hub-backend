'use strict';

const utils = require('@utils/writer');
const GetInvoiceService = require('@service/stats/StatsInvoiceService');

exports.getInvoiceProductsSummary = (req, res) =>
  GetInvoiceService.getInvoiceProductsSummary(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getInvoiceProductsChart = (req, res) =>
  GetInvoiceService.getInvoiceProductsChart(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getInvoiceProducts = (req, res) =>
  GetInvoiceService.getInvoiceProducts(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getInvoiceLines = (req, res) =>
  GetInvoiceService.getInvoiceLines(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
