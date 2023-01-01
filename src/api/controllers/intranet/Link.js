'use strict';

const utils = require('@utils/writer');
const LinkService = require('@service/intranet/LinkService');

const {
  system: { User },
  intranet: { GfUser },
} = require('@models');

module.exports.getState = function getState(req, res, next) {
  LinkService.getState(req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGoogleAuthUrl = function getGoogleAuthUrl(req, res, next) {
  LinkService.getGoogleAuthUrl(req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postLink = function postLink(req, res, next) {
  const body = req.swagger.params.body.value;
  LinkService.postLink(body, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.disconnect = function disconnect(req, res, next) {
  LinkService.disconnect(req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGoogleEventsByGfUserId =
  async function getGoogleEventsByGfUserId(req, res, next) {
    const { start_date, end_date, global_user_id } = req.query;

    LinkService.getGoogleEventsByGfUserId(global_user_id, {
      start_date,
      end_date,
    })
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
