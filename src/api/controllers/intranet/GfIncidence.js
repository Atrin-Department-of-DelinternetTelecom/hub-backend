'use strict';

const utils = require('@utils/writer');
const Incidence = require('@service/intranet/GfIncidenceService');
const { isResponsePayload } = require('@utils/response');

module.exports.deleteGfIncidencesId = function deleteGfIncidencesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Incidence.deleteGfIncidencesId(id, req.user.id, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfIncidences = function getGfIncidences(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Incidence.getGfIncidences(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfIncidencesId = function getGfIncidencesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Incidence.getGfIncidencesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postGfIncidences = function postGfIncidences(req, res, next) {
  const body = req.swagger.params.body.value;
  Incidence.postGfIncidences(body, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putGfIncidencesId = function putGfIncidencesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Incidence.putGfIncidencesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.patchToggleCloseGfIncidencesId =
  function patchToggleCloseGfIncidencesId(req, res, next) {
    const id = req.swagger.params.id.value;
    const body = req.swagger.params.body.value;

    Incidence.patchToggleCloseGfIncidencesId(
      id,
      { ...body, comeFrom: 'incidence' },
      req.user,
    )
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.closeOpenIncidencesWithSuspendedContracts =
  function closeOpenIncidencesWithSuspendedContracts(req, res, next) {
    const userId = req.swagger.params.userId.value;
    const exceptedIds = req.swagger.params.body.value.exceptedIds;

    Incidence.closeOpenIncidencesWithSuspendedContracts(userId, exceptedIds)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
