'use strict';

const utils = require('@utils/writer');
const GfContractDataCell = require('@service/intranet/GfContractDataCellService');

module.exports.getGfContractDataCellsId = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractDataCell.getGfContractDataCellsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putGfContractDataCellsId = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractDataCell.putGfContractDataCellsId(id, req.body, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.syncState = function syncState(req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractDataCell.syncState(id, req.body, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getServices = function syncState(req, res, next) {
  GfContractDataCell.getServices(req.swagger.params.id.value)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.setServices = function syncState(req, res, next) {
  GfContractDataCell.setServices(req.swagger.params.id.value, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLemonServices = function syncState(req, res, next) {
  GfContractDataCell.getLemonServices(req.swagger.params.id.value)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.setLemonServices = function syncState(req, res, next) {
  GfContractDataCell.setLemonServices(req.swagger.params.id.value, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
