'use strict';

const utils = require('@utils/writer');
const FingerPrint = require('@service/hrms/FingerPrintService');

module.exports.deleteFingerprintsId = function deleteFingerprintsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  FingerPrint.deleteFingerprintsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFingerprints = function getFingerprints(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  FingerPrint.getFingerprints(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFingerprintsId = function getFingerprintsId(req, res, next) {
  const id = req.swagger.params.id.value;
  FingerPrint.getFingerprintsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFingerprintsStaff = function getFingerprintsStaff(
  req,
  res,
  next,
) {
  const staff = req.swagger.params.staff.value;
  const device = req.swagger.params.device.value;
  FingerPrint.getFingerprintsStaff(staff, device)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postFingerprintsId = function postFingerprintsId(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  FingerPrint.postFingerprintsId(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putFingerprintsId = function putFingerprintsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  FingerPrint.putFingerprintsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
