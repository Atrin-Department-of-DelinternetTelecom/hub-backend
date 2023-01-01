'use strict';

const utils = require('@utils/writer');
const StatsDocumentsService = require('@service/stats/StatsDocumentsService');

exports.getClientsSepaSummary = (req, res) =>
  StatsDocumentsService.getClientsSepaSummary(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.getClientsSepaStats = (req, res) =>
  StatsDocumentsService.getClientsSepaStats(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
