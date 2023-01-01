'use strict';

const utils = require('@utils/writer');
const Role = require('@service/acl/RoleService');

module.exports.deleteRolesId = function deleteRolesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Role.deleteRolesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRoles = function getRoles(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Role.getRoles(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRolesId = function getRolesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Role.getRolesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putRolesId = function putRolesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Role.putRolesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postRoles = function postRoles(req, res, next) {
  const body = req.swagger.params.body.value;
  Role.postRoles(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.attachRoleToUser = function attachRoleToUser(req, res, next) {
  const body = req.swagger.params.body.value;
  Role.attachRoleToUser(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.attachRoleToPermission = function attachRoleToPermission(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  Role.attachRoleToPermission(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAllAccess = function getAllAccess(req, res, next) {
  Role.getAllAccess()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRolesInfo = function getRolesInfo(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Role.getRolesInfo(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRolesOfUser = function getRolesOfUser(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Role.getRolesOfUser(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.removeRoleOfUser = function removeRoleOfUser(req, res, next) {
  const id = req.swagger.params.id.value;
  Role.removeRoleOfUser(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.removePermissionOfRole = function removePermissionOfRole(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Role.removePermissionOfRole(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
