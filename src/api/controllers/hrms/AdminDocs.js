'use strict';

const utils = require('@utils/writer');
const AdminDocs = require('@service/hrms/AdminDocsService');
const { isResponsePayload } = require('@utils/response');

module.exports.deleteAdminDocsId = function deleteAdminDocsId(req, res, next) {
  const id = req.swagger.params.id.value;
  AdminDocs.deleteAdminDocsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAdminDocs = function getAdminDocs(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  AdminDocs.getAdminDocs(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAdminDocsId = function getAdminDocsId(req, res, next) {
  const id = req.swagger.params.id.value;
  AdminDocs.getAdminDocsId(id)
    .then(function (response) {
      // res.download(response);
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAdminDocsFileId = function getAdminDocsFileId(
  req,
  res,
  next,
) {
  // for file
  const id = req.swagger.params.id.value;
  AdminDocs.getAdminDocsFileId(id)
    .then(function (response) {
      if (response.code) utils.writeJson(res, response);
      else res.download(response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putAdminDocsId = function putAdminDocsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  AdminDocs.putAdminDocsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postSendDoc = function postSendDoc(req, res, next) {
  // for file
  req.body.creator_id = req.user.id;
  AdminDocs.postSendDoc(req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postAdminDocs = function postAdminDocs(req, res, next) {
  req.body.creator_id = req.user.id;
  AdminDocs.postAdminDocsId(req.body, req.files.document)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAdminDocsImageId = function getAdminDocsImageId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  AdminDocs.getAdminDocsImageId(id)
    .then(function (media) {
      if (isResponsePayload(media)) {
        utils.writeJson(res, media);
      } else {
        res.download(media);
      }
    })
    .catch(function (media) {
      utils.writeJson(res, media);
    });
};
