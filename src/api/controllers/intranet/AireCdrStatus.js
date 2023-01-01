'use strict';

const utils = require('@utils/writer');
const mobilCdr = require('@service/intranet/MobilCDR_GfFrontService');
const AireCdrStatus = require('@service/intranet/AireCdrStatusService');

module.exports.getAireCdrReload = function getAireCdrReload(req, res, next) {
  const date = req.swagger.params.date.value;
  mobilCdr
    .reloadCdr(date)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAireCdrStatus = function getAireCdrStatus(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  AireCdrStatus.getAireCdrStatus(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
