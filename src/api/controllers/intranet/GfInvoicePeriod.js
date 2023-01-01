'use strict';

const utils = require('@utils/writer');
const GfInvoicePeriod = require('@service/intranet/GfInvoicePeriodService');

module.exports.deleteGfInvoicePeriodsId = function deleteGfInvoicePeriodsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfInvoicePeriod.deleteGfInvoicePeriodsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfInvoicePeriods = function getGfInvoicePeriods(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfInvoicePeriod.getGfInvoicePeriods(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfInvoicePeriodsId = function getGfInvoicePeriodsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfInvoicePeriod.getGfInvoicePeriodsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postGfInvoicePeriods = function postGfInvoicePeriods(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  GfInvoicePeriod.postGfInvoicePeriods(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putGfInvoicePeriodsId = function putGfInvoicePeriodsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  GfInvoicePeriod.putGfInvoicePeriodsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.createCueues = function createCueues(req, res, next) {
  const periodId = req.swagger.params.periodId.value;
  const phase = req.swagger.params.phase.value;
  GfInvoicePeriod.createCueues(periodId, phase, req.user.id, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfInvoicePeriodsInitPreparatives =
  function getGfInvoicePeriodsInitPreparatives(req, res, next) {
    const periodId = req.swagger.params.periodId.value;
    const single = req.swagger.params.single.value;
    GfInvoicePeriod.initPreparatives(periodId, single, req.user.id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.aireFactorStatus = function aireFactorStatus(req, res, next) {
  const periodId = req.swagger.params.periodId.value;
  GfInvoicePeriod.aireFactorStatus(periodId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
