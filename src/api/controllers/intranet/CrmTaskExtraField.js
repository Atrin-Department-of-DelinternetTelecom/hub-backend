'use strict';

const utils = require('@utils/writer');
const CrmTaskExtraField = require('@service/intranet/CrmTaskExtraFieldService');

module.exports.getCrmTaskExtraFields = function getCrmTaskExtraFields(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  CrmTaskExtraField.getCrmTaskExtraFields(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postCrmTaskExtraFields = function postCrmTaskExtraFields(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  CrmTaskExtraField.postCrmTaskExtraFields(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putCrmTaskExtraFieldsId = function putCrmTaskExtraFieldsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  CrmTaskExtraField.putCrmTaskExtraFieldsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCrmTaskExtraFieldsId = function getCrmTaskExtraFieldsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  CrmTaskExtraField.getCrmTaskExtraFieldsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteCrmTaskExtraFieldsId = function deleteCrmTaskExtraFieldsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  CrmTaskExtraField.deleteCrmTaskExtraFieldsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
