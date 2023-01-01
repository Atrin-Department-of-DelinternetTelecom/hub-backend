'use strict';

const utils = require('@utils/writer');
const Permission = require('@service/acl/PermissionService');

module.exports.deletePermissionsId = function deletePermissionsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Permission.deletePermissionsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPermissions = function getPermissions(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Permission.getPermissions(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPermissionsId = function getPermissionsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Permission.getPermissionsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putPermissionsId = function putPermissionsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Permission.putPermissionsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postPermissions = function postPermissions(req, res, next) {
  const body = req.swagger.params.body.value;
  Permission.postPermissions(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
