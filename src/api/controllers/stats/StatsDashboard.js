'use strict';

const utils = require('@utils/writer');
const Dashboard = require('@service/stats/StatsDashboardService');

exports.getClientsStats = (req, res, next) =>
  Dashboard.getClientsStats()
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
