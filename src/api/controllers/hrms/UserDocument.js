'use strict';

const utils = require('@utils/writer');
const UserDocuments = require('@service/hrms/UserDocumentService');

module.exports.getUserDocuments = function getUserDocuments(req, res) {
  const url = new URL(req.protocol + '://' + req.get('host'));

  UserDocuments.getUserDocuments(req.query, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserDocumentById = function getUserDocumentById(
  req,
  res,
  next,
) {
  const url = new URL(req.protocol + '://' + req.get('host'));
  const id = req.swagger.params.id.value;
  UserDocuments.getUserDocumentById(id, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postUserDocument = function postUserDocument(req, res, next) {
  UserDocuments.postUserDocument(req.body, req.files.file, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteUserDocument = function deleteUserDocument(
  req,
  res,
  next,
) {
  const UserDocumentId = req.swagger.params.id.value;
  UserDocuments.deleteUserDocument(UserDocumentId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateUserDocument = function updateUserDocument(
  req,
  res,
  next,
) {
  const userDocumentId = req.swagger.params.id.value;

  const { body = {}, user = {} } = req;

  const { id: userId } = user;
  UserDocuments.updateUserDocument(
    userDocumentId,
    body,
    req.files?.file,
    userId,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
