'use strict';

const utils = require('@utils/writer');
const StatsDiscountsService = require('@service/stats/StatsDiscountsService');

exports.getContractsDiscountSummary = (req, res) =>
  StatsDiscountsService.getContractsDiscountSummary()
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getPackageDiscountSummary = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  StatsDiscountsService.getPackageDiscountSummary(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
};

exports.getPackageDiscountSummaries = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  StatsDiscountsService.getPackageDiscountSummaries(req, req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
};
