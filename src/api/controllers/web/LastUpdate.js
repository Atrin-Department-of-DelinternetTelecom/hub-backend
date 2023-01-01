'use strict';

const utils = require('@utils/writer');
const LastUpdateService = require('@service/web/LastUpdateService');
const { LastUpdate } = require('@models').system;

module.exports.getLastUpdate = function getLastUpdate(req, res, next) {
  LastUpdateService.getLastUpdate(LastUpdate)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
