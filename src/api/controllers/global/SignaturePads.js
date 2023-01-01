// @ts-check
'use strict';

const utils = require('@utils/writer');
const SignaturePad = require('@service/hrms/SignaturePadService');

exports.deleteSignaturePadsId = function (req, res) {
  const id = req.swagger.params.id.value;
  SignaturePad.deleteSignaturePadsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getSignaturePads = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  SignaturePad.getSignaturePads(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getSignaturePadsId = function (req, res) {
  const id = req.swagger.params.id.value;
  SignaturePad.getSignaturePadsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.postSignaturePad = function (req, res) {
  const body = req.swagger.params.body.value;
  SignaturePad.postSignaturePad(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.putSignaturePadsId = function (req, res) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  SignaturePad.putSignaturePadsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.requestSign = function (req, res) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  SignaturePad.requestSign(id, req.user, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.replySign = function (req, res) {
  const id = req.swagger.params.id.value;
  const sender_id = req.swagger.params.sender_id.value;
  const param = req.swagger.params.param.value;

  SignaturePad.replySign(id, sender_id, req.files.signature, param)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, response);
    });
};

exports.cancelSign = function (req, res) {
  const id = req.swagger.params.id.value;
  SignaturePad.cancelSign(id)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, response);
    });
};
