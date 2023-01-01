// @ts-check
'use strict';

const GfDoc = require('@service/intranet/GfDocService');
const DocumentService = require('@service/documents/DocumentService');
const utils = require('@utils/writer');
const { respondOK } = require('@utils/response');
const {
  transmitDocumentUploadHistory,
  transmitDataProtectionDocument,
} = require('@api/service/intranet/ScheduleService');

exports.deleteGfDocsId = function deleteGfDocsId(req, res, next) {
  const id = req.swagger.params.id.value;
  GfDoc.destroyGfDocsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGfDocs = function getGfDocs(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfDoc.getGfDocs(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGfDocsId = function getGfDocsId(req, res, next) {
  const id = req.swagger.params.id.value;
  GfDoc.getGfDocsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.putGfDocsId = function putGfDocsId(req, res, next) {
  const id = req.swagger.params.id.value;
  GfDoc.putGfDocsId(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.uploadToAire = async function uploadToAire(req, res, next) {
  const id = req.swagger.params.id.value;
  try {
    await DocumentService.uploadToAire(id, req.user.userId);
    utils.writeJson(res, respondOK('uploaded to aire'));
  } catch (e) {
    utils.writeJson(res, e);
  }
};

exports.transmitUploadHistory = async function uploadToAire(req, res, next) {
  try {
    await transmitDocumentUploadHistory(req.user.userId);
    utils.writeJson(res, respondOK('Transfer history is scheduled!'));
  } catch (e) {
    utils.writeJson(res, e);
  }
};

exports.transmitDataProtectionDocuments = async function uploadToAire(
  req,
  res,
  next,
) {
  try {
    await transmitDataProtectionDocument(req.user.id);
    utils.writeJson(
      res,
      respondOK('Transfer data protection documents is scheduled!'),
    );
  } catch (e) {
    utils.writeJson(res, e);
  }
};
