'use strict';

const utils = require('@utils/writer');
const CrmTaskType = require('@service/intranet/CrmTaskTypeService');

module.exports.createCrTaskType = function createCrTaskType(req, res, next) {
  const body = req.swagger.params.body.value;

  CrmTaskType.createCrTaskType(body, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCrmTaskTypes = function getCrmTaskTypes(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  CrmTaskType.getCrmTaskTypes(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putCrmTaskTypesId = function putCrmTaskTypesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  CrmTaskType.putCrmTaskTypesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCrmTaskTypesId = function getCrmTaskTypesId(req, res, next) {
  const id = req.swagger.params.id.value;
  CrmTaskType.getCrmTaskTypesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteCrmTaskTypesId = function deleteCrmTaskTypesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  CrmTaskType.deleteCrmTaskTypesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
