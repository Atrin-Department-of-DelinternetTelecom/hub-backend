'use strict';

const utils = require('@utils/writer');
const Service = require('@service/stats/StatsIncidencesService');

exports.getIncidencesChart = (req, res) =>
  Service.getIncidencesChart(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getTimeToResolveChart = (req, res) =>
  Service.getTimeToResolveChart(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getIncidencePerUser = (req, res) =>
  Service.getIncidencePerUser(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getIncidenceStatsForUser = (req, res) => {
  const id = req.swagger.params.id.value;

  return Service.getIncidenceStatsForUser(id, req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
};
