'use strict';

const utils = require('@utils/writer');
const StatsClientsService = require('@service/stats/StatsClientsService');

exports.getClients = (req, res) =>
  StatsClientsService.getClients(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
