// @ts-check
'use strict';

const Backup = require('@service/global/BackupService');
const { respondSuccess } = require('@utils/response');
const utils = require('@utils/writer');

exports.getAllBackups = function (req, res) {
  Backup.getAllBackups(req.query)
    .then((response) => utils.writeJson(res, response))
    .catch((response) => utils.writeJson(res, response));
};

exports.getBackupId = function (req, res) {
  const id = req.swagger.params.id.value;

  Backup.getBackupId(id)
    .then((response) => utils.writeJson(res, response))
    .catch((response) => utils.writeJson(res, response));
};

exports.deleteBackupId = function (req, res) {
  const id = req.swagger.params.id.value;

  Backup.deleteBackupId(id)
    .then((response) => utils.writeJson(res, response))
    .catch((response) => utils.writeJson(res, response));
};

exports.checkDependencies = function (req, res) {
  const retry = req.query?.retry === 'true';

  Backup.checkDependencies({ retry })
    .then((result) => utils.writeJson(res, respondSuccess(result)))
    .catch((response) => utils.writeJson(res, response));
};

exports.triggerCompleteDump = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  const body = req.swagger.params.body.value;

  Backup.triggerCompleteDump(body?.ignoreTables)
    .then((response) => utils.writeJson(res, response))
    .catch((response) => utils.writeJson(res, response));
};

exports.triggerCustomDump = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  Backup.triggerCustomDump(req.body)
    .then((response) => utils.writeJson(res, response))
    .catch((response) => utils.writeJson(res, response));
};

exports.restore = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  const id = req.swagger.params.id.value;
  const database = req.swagger.params.database.value;

  Backup.restore(id, database)
    .then((response) => utils.writeJson(res, response))
    .catch((response) => utils.writeJson(res, response));
};

exports.importUrl = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  Backup.importUrl(req.body)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => utils.writeJson(res, response));
};

exports.download = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  Backup.download(req.query, res)
    .then((response) => {
      if (!response) return;
      utils.writeJson(res, response);
    })
    .catch((response) => utils.writeJson(res, response));
};

exports.getSecureDownloadLink = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  const id = req.swagger.params.id.value;

  Backup.getSecureDownloadLink({
    id,
    host: req.protocol + '://' + req.get('host'),
  })
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => utils.writeJson(res, response));
};

exports.sync = function (req, res) {
  Backup.sync()
    .then((response) => utils.writeJson(res, response))
    .catch((response) => utils.writeJson(res, response));
};

exports.getDatabases = function (req, res) {
  Backup.getDatabases()
    .then((result) => utils.writeJson(res, respondSuccess(result)))
    .catch((response) => utils.writeJson(res, response));
};

exports.getDatabaseTables = function (req, res) {
  const id = req.swagger.params.id.value;
  Backup.getDatabaseTables(id)
    .then((result) => utils.writeJson(res, respondSuccess(result)))
    .catch((response) => utils.writeJson(res, response));
};
