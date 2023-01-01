'use strict';

const utils = require('@utils/writer');
const UserContracts = require('@service/hrms/UserContractService');

module.exports.getUserContracts = function getUserContracts(req, res) {
  const url = new URL(req.protocol + '://' + req.get('host'));

  UserContracts.getUserContracts(req.query, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserContractByGfContractId =
  function getUserContractByGfContractId(req, res, next) {
    const url = new URL(req.protocol + '://' + req.get('host'));
    const id = req.swagger.params.id.value;
    UserContracts.getUserContractByGfContractId(id, url)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getUserContractById = function getUserContractById(
  req,
  res,
  next,
) {
  const url = new URL(req.protocol + '://' + req.get('host'));
  const id = req.swagger.params.id.value;
  UserContracts.getUserContractById(id, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postUserContract = function postUserContract(req, res, next) {
  UserContracts.postUserContract(req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteUserContract = function deleteUserContract(
  req,
  res,
  next,
) {
  const userContractId = req.swagger.params.id.value;
  UserContracts.deleteUserContract(userContractId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateUserContract = function updateUserContract(
  req,
  res,
  next,
) {
  const userContractId = req.swagger.params.id.value;
  UserContracts.updateUserContract(userContractId, req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
