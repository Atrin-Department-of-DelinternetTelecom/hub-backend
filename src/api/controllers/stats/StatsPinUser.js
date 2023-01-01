'use strict';

const utils = require('@utils/writer');
const StatsPinUserService = require('@service/stats/StatsPinUserService');

exports.postPinUser = (req, res) =>
  StatsPinUserService.postPinUser(req.body)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));

exports.deleteUnpinUser = (req, res) =>
  StatsPinUserService.deleteUnpinUser(req.swagger.params.row.value)
    .then((result) => utils.writeJson(res, result))
    .catch((err) => utils.writeJson(res, err));
