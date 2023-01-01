'use strict';

const utils = require('@utils/writer');
const StatsTaskTypesService = require('@service/stats/StatsTaskTypesService');

exports.getTaskTypesStats = (req, res, next) =>
  StatsTaskTypesService.getTaskTypesStats(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getSellerTaskTypesStats = (req, res, next) => {
  const id = req.swagger.params.id.value;

  StatsTaskTypesService.getSellerTaskTypesStats(id, req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
};
