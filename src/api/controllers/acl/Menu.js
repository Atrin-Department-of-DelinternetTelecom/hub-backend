'use strict';

const utils = require('@utils/writer');
const Menu = require('@service/acl/MenuService');

module.exports.deleteMenusId = function deleteMenusId(req, res, next) {
  const id = req.swagger.params.id.value;
  Menu.deleteMenusId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMenus = function getMenus(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Menu.getMenus(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMenusId = function getMenusId(req, res, next) {
  const id = req.swagger.params.id.value;
  Menu.getMenusId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putMenusId = function putMenusId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Menu.putMenusId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postMenus = function postMenus(req, res, next) {
  const body = req.swagger.params.body.value;
  Menu.postMenus(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
