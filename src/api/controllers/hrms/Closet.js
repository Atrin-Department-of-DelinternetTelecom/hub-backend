'use strict';

const utils = require('@utils/writer');
const Closet = require('@service/hrms/ClosetService');

module.exports.deleteClosetsId = function deleteClosetsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Closet.deleteClosetsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getClosets = function getClosets(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Closet.getClosets(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getClosetsId = function getClosetsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Closet.getClosetsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.changeStateOfClosets = function changeStateOfClosets(
  req,
  res,
  next,
) {
  Closet.changeStateOfClosets(req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.changeStateOfClosetsId = function changeStateOfClosetsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Closet.changeStateOfClosetsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.closetAssignUser = function closetAssignUser(req, res, next) {
  const body = req.swagger.params.body.value;
  Closet.attachClosetToUser(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postClosetsId = function postClosetsId(req, res, next) {
  const body = req.swagger.params.body.value;
  Closet.postClosetsId(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putClosetsId = function putClosetsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Closet.putClosetsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
