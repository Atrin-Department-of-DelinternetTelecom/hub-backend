// @ts-check
'use strict';

const utils = require('@utils/writer');
const Service = require('@service/stats/StatsSellersService');
const { createRoute } = require('@api/utils/controller-factory');

exports.getSellersStats = (req, res, next) =>
  Service.getSellersStats(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getSellerInfo = (req, res, next) => {
  const id = req.swagger.params.id.value;

  return Service.getSellerInfo(id)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
};

exports.getSellerSellsStats = (req, res, next) => {
  const id = req.swagger.params.id.value;

  return Service.getSellerSellsStats(id, req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
};

exports.getTotalStats = (req, res, next) =>
  Service.getTotalStats(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getContractsSoldBySeller = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;

    return Service.getContractsSoldBySeller(id, req.query);
  },
});

exports.getTotalContractBaseQuoteSoldBySeller = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;

    return Service.getTotalContractBaseQuoteSoldBySeller(id, req.query);
  },
});

exports.getClientsSoldBySeller = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;

    return Service.getClientsSoldBySeller(id, req.query);
  },
});

exports.getSellerPoints = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;

    return Service.getSellerPoints(id, req.query);
  },
});

exports.getSellerPoints = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;

    return Service.getSellerPoints(id, req.query);
  },
});

exports.getSellerPointsChart = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;

    return Service.getSellerPointsChart(id, req.query);
  },
});
