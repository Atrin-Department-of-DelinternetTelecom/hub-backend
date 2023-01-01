'use strict';

const utils = require('@utils/writer');
const UnpaidNotification = require('@service/unpaid/UnpaidNotificationService');
const UnpaidSendNotifications = require('@service/unpaid/UnpaidSendNotificationsService');
const { respondOK } = require('@api/utils/response');

module.exports.deleteUnpaidNotificationsId =
  function deleteUnpaidNotificationsId(req, res, next) {
    const id = req.swagger.params.id.value;
    UnpaidNotification.deleteUnpaidNotificationsId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getUnpaidNotifications = function getUnpaidNotifications(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  UnpaidNotification.getUnpaidNotifications(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUnpaidNotificationsId = function getUnpaidNotificationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  UnpaidNotification.getUnpaidNotificationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postUnpaidNotifications = function postUnpaidNotifications(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  UnpaidNotification.postUnpaidNotifications(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putUnpaidNotificationsId = function putUnpaidNotificationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  UnpaidNotification.putUnpaidNotificationsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.sendNotification = function sendNotification(req, res) {
  const id = req.swagger.params.id.value;
  UnpaidSendNotifications.sendNotification(id, true)
    .then(function (response) {
      utils.writeJson(res, respondOK(response));
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.generateNotificationTextMessage =
  function generateNotificationTextMessage(req, res) {
    const body = req.swagger.params.body.value;
    const templateName = req.swagger.params.name.value;

    UnpaidNotification.generateNotificationTextMessage(templateName, body)
      .then(function (response) {
        console.log(response);
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        console.log(response);

        utils.writeJson(res, response);
      });
  };

module.exports.fixWrongClientNotifications =
  function fixWrongClientNotifications(req, res, next) {
    // your auth middleware usually puts user in req.user
    const user = req.user || null;

    UnpaidNotification.fixCurrentMonthUnpaidNotifications(user)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (error) {
        utils.writeJson(res, error);
      });
  };
