'use strict';

const utils = require('@utils/writer');
const CrmUser = require('@service/intranet/CrmUserService');
const { isResponsePayload } = require('@utils/response');

module.exports.getCrmUsers = function getCrmUsers(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  CrmUser.getCrmUsers(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putCrmUsersId = function putCrmUsersId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  CrmUser.putCrmUsersId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCrmUsersId = function getCrmUsersId(req, res, next) {
  const id = req.swagger.params.id.value;
  CrmUser.getCrmUsersId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
