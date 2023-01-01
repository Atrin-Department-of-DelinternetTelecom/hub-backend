'use strict';

const utils = require('@utils/writer');
const StatsFeeGroupsService = require('@service/stats/StatsFeeGroupsService');

exports.getFeeGroups = (req, res) =>
  StatsFeeGroupsService.getFeeGroups(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.feeGroupsSummary = (req, res) =>
  StatsFeeGroupsService.feeGroupsSummary(req.query)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
