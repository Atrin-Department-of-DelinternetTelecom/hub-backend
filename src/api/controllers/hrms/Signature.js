'use strict';

const path = require('path');
const config = require('@config');
const utils = require('@utils/writer');
const Signature = require('@service/hrms/SignatureService');
const { File, Signature: SignatureModel } = require('@models').system;
const { isResponsePayload } = require('@utils/response');

module.exports.deleteSignaturesId = function deleteSignaturesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Signature.deleteSignaturesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSignaturesId = function getSignaturesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Signature.getSignaturesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSinatures = function getSinatures(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Signature.getSinatures(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSinaturesGet = function getSinaturesGet(req, res, next) {
  const id = req.swagger.params.id.value;
  Signature.getSinaturesGet(id)
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

module.exports.postSinatures = function postSinatures(req, res, next) {
  const body = {};
  body.owner_id = req.swagger.params.owner_id.value;
  body.creator_id = req.user.id;
  Signature.postSinatures(body, req.files.signature)
    .then(async function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putSignaturesId = function putSignaturesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Signature.putSignaturesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
