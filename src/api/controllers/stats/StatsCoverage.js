'use strict';

const utils = require('@utils/writer');
const StatsCoverageService = require('@service/stats/StatsCoverageService');

exports.getCoverageStats = (req, res) =>
  StatsCoverageService.getCoverageStats(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
