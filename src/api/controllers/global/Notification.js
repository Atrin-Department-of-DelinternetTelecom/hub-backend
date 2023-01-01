'use strict';

const utils = require('@utils/writer');
const Notification = require('@service/global/NotificationService');

module.exports.deleteNotificationsId = function deleteNotificationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Notification.deleteNotificationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getNotifications = function getNotifications(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Notification.getNotifications(req.query)
    .then(function (response) {
      if (response.code) utils.writeJson(res, response);
      else res.download(response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getNotificationsId = function getNotificationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Notification.getNotificationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putNotificationsId = function putNotificationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Notification.putNotificationsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postNotifications = function postNotifications(req, res, next) {
  const body = req.swagger.params.body.value;
  Notification.postNotifications(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getNotificationsUserId = function getNotificationsUserId(
  req,
  res,
  next,
) {
  const user_id = req.swagger.params.userId.value;
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Notification.getNotificationsUserId(req.query, user_id)
    .then(function (response) {
      if (response.code) utils.writeJson(res, response);
      else res.download(response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMyNotifications = function getMyNotifications(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Notification.getMyNotifications(req.query, req.user.id)
    .then(function (response) {
      if (response.code) utils.writeJson(res, response);
      else res.download(response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postSetAsReadNotifications = function postSetAsReadNotifications(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  Notification.postSetAsReadNotifications(
    body.notifications_ids,
    body.reference,
    body.seen_all,
    req.user.id,
    req.user.userId,
  )
    .then(function (response) {
      if (response.code) utils.writeJson(res, response);
      else res.download(response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMyIntranetNotification = function getMyIntranetNotification(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Notification.getMyIntranetNotification(req.query, req.user.userId)
    .then(function (response) {
      if (response.code) utils.writeJson(res, response);
      else res.download(response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.countMyUnreadIntranetNotification =
  function countMyUnreadIntranetNotification(req, res, next) {
    Notification.countMyUnreadIntranetNotification(req.user.userId)
      .then(function (response) {
        if (response.code) utils.writeJson(res, response);
        else res.download(response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
