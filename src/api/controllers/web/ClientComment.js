'use strict';

const utils = require('@utils/writer');
const ClientComment = require('@service/web/ClientComment');
const { URL } = require('url');

module.exports.deleteClientCommentsId = function deleteClientCommentsId(
  req,
  res,
) {
  const id = req.swagger.params.id.value;
  ClientComment.deleteClientCommentsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getClientComments = function getClientComments(req, res) {
  const url = new URL(req.protocol + '://' + req.get('host'));
  ClientComment.getClientComments(req.query, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getClientCommentsId = function getClientCommentsId(req, res) {
  const url = new URL(req.protocol + '://' + req.get('host'));
  const id = req.swagger.params.id.value;
  ClientComment.getClientCommentsId(id, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postClientComments = function postClientComments(req, res) {
  ClientComment.postClientComments(req.body, req.files.avatar)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putClientCommentsId = function putClientCommentsId(req, res) {
  const id = req.swagger.params.id.value;
  ClientComment.putClientCommentsId(id, req.body, req.files?.avatar)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
