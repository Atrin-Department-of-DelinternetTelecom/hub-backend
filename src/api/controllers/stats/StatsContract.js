'use strict';

const utils = require('@utils/writer');
const ContractService = require('@service/stats/StatsContractsService');
const ContractCohort = require('@service/stats/StatsContractsCohortService');
const { createRoute } = require('@utils/controller-factory');

exports.getContractsTotalStats = (req, res, next) =>
  ContractService.getContractsTotalStats()
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getContractsChart = (req, res, next) =>
  ContractService.getContractsChart(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getContractsCohortChart = (req, res, next) =>
  ContractCohort.getContractsCohortChart(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.contractsWithUnusedCpeDevice = createRoute({
  handler: (req) => ContractService.contractsWithUnusedCpeDevice(req.query),
});

exports.contractsWithUnfinishedInstallation = createRoute({
  handler: (req) =>
    ContractService.contractsWithUnfinishedInstallation(req.query),
});

exports.contractsWithDiscount = createRoute({
  handler: (req) => ContractService.contractsWithDiscount(req.query),
});
