'use strict';

const utils = require('@utils/writer');
const Message = require('@service/hrms/MessageService');

module.exports.deleteMessagesId = function deleteMessagesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Message.deleteMessagesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMessages = function getMessages(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Message.getMessages(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMessagesId = function getMessagesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Message.getMessagesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postMessages = function postMessages(req, res, next) {
  const body = req.swagger.params.body.value;

  Message.postMessages(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putMessagesId = function putMessagesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Message.putMessagesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserMessagesId = function getUserMessagesId(req, res, next) {
  const id = req.swagger.params.id.value;
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Message.getUserMessagesId(id, req.query, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUsersChatsId = function getUsersChatsId(req, res, next) {
  Message.getUsersChatsId(req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.setSeenUserId = function setSeenUserId(req, res, next) {
  const id = req.swagger.params.id.value;
  Message.setSeenUserId(id, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
