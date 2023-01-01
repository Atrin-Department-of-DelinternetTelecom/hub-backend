'use strict';

const utils = require('@utils/writer');
const Folder = require('@service/hrms/FolderService');

module.exports.deleteFoldersId = function deleteFoldersId(req, res, next) {
  const id = req.swagger.params.id.value;
  Folder.deleteFoldersId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFolders = function getFolders(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Folder.getFolders(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFoldersId = function getFoldersId(req, res, next) {
  const id = req.swagger.params.id.value;
  Folder.getFoldersId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postFolders = function postFolders(req, res, next) {
  const body = req.swagger.params.body.value;
  Folder.postFolders(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putFoldersId = function putFoldersId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Folder.putFoldersId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
