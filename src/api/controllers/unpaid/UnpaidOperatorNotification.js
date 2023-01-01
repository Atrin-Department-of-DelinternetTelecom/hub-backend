'use strict';

const utils = require('@utils/writer');
const UnpaidOperatorNotification = require('@service/unpaid/UnpaidOperatorNotificationService');

module.exports.deleteUnpaidOperatorNotificationsId =
  function deleteUnpaidOperatorNotificationsId(req, res, next) {
    const id = req.swagger.params.id.value;
    UnpaidOperatorNotification.deleteUnpaidOperatorNotificationsId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getUnpaidOperatorNotifications =
  function getUnpaidOperatorNotifications(req, res, next) {
    req.query.url =
      req.protocol +
      '://' +
      req.get('host') +
      req.url.slice(0, req.url.indexOf('?'));
    UnpaidOperatorNotification.getUnpaidOperatorNotifications(req.query)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getUnpaidOperatorNotificationsId =
  function getUnpaidOperatorNotificationsId(req, res, next) {
    const id = req.swagger.params.id.value;
    UnpaidOperatorNotification.getUnpaidOperatorNotificationsId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.postUnpaidOperatorNotifications =
  function postUnpaidOperatorNotifications(req, res, next) {
    const body = req.swagger.params.body.value;
    UnpaidOperatorNotification.postUnpaidOperatorNotifications(body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.putUnpaidOperatorNotificationsId =
  function putUnpaidOperatorNotificationsId(req, res, next) {
    const id = req.swagger.params.id.value;
    const body = req.swagger.params.body.value;
    UnpaidOperatorNotification.putUnpaidOperatorNotificationsId(id, body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.setIssueAsSeen = function setIssueAsSeen(req, res, next) {
  const invoice_id = req.swagger.params.invoice_id.value;
  const issue_id = req.swagger.params.issue_id.value;
  UnpaidOperatorNotification.setIssueAsSeen(invoice_id, issue_id, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
