'use strict';

const utils = require('@utils/writer');
const TimeSheet = require('@service/hrms/TimeSheetService');

module.exports.deleteTimeSheetId = function deleteTimeSheetId(req, res, next) {
  const id = req.swagger.params.id.value;
  TimeSheet.deleteTimeSheetId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTimeSheetId = function getTimeSheetId(req, res, next) {
  const id = req.swagger.params.id.value;
  TimeSheet.getTimeSheetId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTimeSheets = function getTimeSheets(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  TimeSheet.getTimeSheets(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTimeSheetsGetsheet = function getTimeSheetsGetsheet(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  TimeSheet.getTimeSheetsGetsheet(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postTimeSheets = function postTimeSheets(req, res, next) {
  const body = req.swagger.params.body.value;
  TimeSheet.postTimeSheets(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTimeSheetId = function putTimeSheetId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  TimeSheet.putTimeSheetId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
