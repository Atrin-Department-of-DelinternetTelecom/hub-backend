'use strict';

const utils = require('@utils/writer');
const Temprary = require('@service/global/TempraryService');

module.exports.getNieInternetClients = function getNieInternetClients(
  req,
  res,
  next,
) {
  Temprary.getNieInternetClients()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getBusinessClient = function getBusinessClient(req, res, next) {
  Temprary.getBusinessClient()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
