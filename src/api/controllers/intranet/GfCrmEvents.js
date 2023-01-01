'use strict';

const utils = require('@utils/writer');
const GfCrmEvents = require('@service/intranet/GfCrmEventsService');

module.exports.createGfCrmEvent = function createGfCrmEvent(req, res, next) {
  const body = req.swagger.params.body.value;

  GfCrmEvents.createGfCrmEvent(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfCrmEvents = function getGfCrmEvents(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfCrmEvents.getGfCrmEvents(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfCrmEventId = function getGfCrmEventId(req, res, next) {
  const id = req.swagger.params.id.value;

  GfCrmEvents.getGfCrmEventId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateGfCrmEvent = function updateGfCrmEvent(req, res, next) {
  const id = req.swagger.params.id.value;

  GfCrmEvents.updateGfCrmEvent(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteGfCrmEvent = function deleteGfCrmEvent(req, res, next) {
  const id = req.swagger.params.id.value;

  GfCrmEvents.deleteGfCrmEvent(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
