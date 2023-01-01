'use strict';

const utils = require('@utils/writer');
const IntranetMessage = require('@service/intranet/IntranetMessageService');

module.exports.getIntranetMessages = function getIntranetMessages(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  IntranetMessage.getIntranetMessages(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postIntranetMessages = function postIntranetMessages(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  IntranetMessage.postIntranetMessages(body, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getIntranetMessagesCountUnRead =
  function getIntranetMessagesCountUnRead(req, res, next) {
    const filter = req.swagger.params.filter.value;
    IntranetMessage.getUnreadCount([req.user.userId], { filter })
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getUnreadsForUser = function getUnreadsForUser(req, res, next) {
  const filter = req.swagger.params.filter.value;
  IntranetMessage.getUnreadsForUser([req.user.userId], filter)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postIntranetMessagesSetAsRead =
  function postIntranetMessagesSetAsRead(req, res, next) {
    const { filter, limit } = req.swagger.params.body.value;
    IntranetMessage.setAsRead(req.user.userId, { filter }, limit)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
