'use strict';

const utils = require('@utils/writer');
const CrmNotificationsPreference = require('@service/intranet/CrmNotificationsPreferenceService');

module.exports.deleteCrmNotificationsPreferencesId =
  function deleteCrmNotificationsPreferencesId(req, res, next) {
    const id = req.swagger.params.id.value;
    CrmNotificationsPreference.destroyCrmNotificationsPreferencesId(
      id,
      req.user.userId,
    )
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getCrmNotificationsPreferences =
  function getCrmNotificationsPreferences(req, res, next) {
    req.query.url =
      req.protocol +
      '://' +
      req.get('host') +
      req.url.slice(0, req.url.indexOf('?'));
    CrmNotificationsPreference.getCrmNotificationsPreferences(req.query)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getCrmNotificationsPreferencesId =
  function getCrmNotificationsPreferencesId(req, res, next) {
    const id = req.swagger.params.id.value;
    CrmNotificationsPreference.getCrmNotificationsPreferencesId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.postCrmNotificationsPreferences =
  function postCrmNotificationsPreferences(req, res, next) {
    const body = req.swagger.params.body.value;
    CrmNotificationsPreference.postCrmNotificationsPreferences(
      body,
      req.user.userId,
    )
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.putCrmNotificationsPreferencesId =
  function putCrmNotificationsPreferencesId(req, res, next) {
    const id = req.swagger.params.id.value;
    const body = req.swagger.params.body.value;
    CrmNotificationsPreference.putCrmNotificationsPreferencesId(
      id,
      body,
      req.user.userId,
    )
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
