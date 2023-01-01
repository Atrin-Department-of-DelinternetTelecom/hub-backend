'use strict';

const utils = require('@utils/writer');
const StatsTagsService = require('@service/stats/StatsTagsService');

exports.getTagsStats = (req, res, next) =>
  StatsTagsService.getTagsStats(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getTagStats = (req, res, next) => {
  const id = req.swagger.params.id.value;

  StatsTagsService.getTagStats(id)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
};

exports.getTagStatsPerUser = (req, res, next) => {
  const id = req.swagger.params.id.value;

  StatsTagsService.getTagStatsPerUser(id, req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
};

exports.getTagChart = (req, res, next) => {
  const id = req.swagger.params.id.value;

  StatsTagsService.getTagChart(id, req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
};
