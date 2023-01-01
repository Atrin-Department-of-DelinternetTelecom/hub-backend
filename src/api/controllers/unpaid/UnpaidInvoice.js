'use strict';

const utils = require('@utils/writer');
const UnpaidInvoice = require('@service/unpaid/UnpaidInvoiceService');
const GfContractsUnpaidService = require('@service/intranet/GfContractsUnpaidService');

exports.deleteUnpaidInvoicesId = function deleteUnpaidInvoicesId(req, res) {
  const id = req.swagger.params.id.value;
  UnpaidInvoice.deleteUnpaidInvoicesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getUnpaidInvoices = function getUnpaidInvoices(req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  UnpaidInvoice.getUnpaidInvoices(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getUnpaidInvoicesId = function getUnpaidInvoicesId(req, res) {
  const id = req.swagger.params.id.value;
  UnpaidInvoice.getUnpaidInvoicesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.postUnpaidInvoices = function postUnpaidInvoices(req, res) {
  const body = req.swagger.params.body.value;
  UnpaidInvoice.postUnpaidInvoices(body, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.putUnpaidInvoicesId = function putUnpaidInvoicesId(req, res) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  UnpaidInvoice.putUnpaidInvoicesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.postResumeUnpaidInvoiceId = function postResumeUnpaidInvoiceId(
  req,
  res,
) {
  const id = req.swagger.params.id.value;
  const { shopId, paymentType, includeCommission } =
    req.swagger.params.body.value;
  UnpaidInvoice.postResumeUnpaidInvoiceId(id, req.user, {
    shopId,
    paymentType,
    includeCommission,
  })
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.postResumeUnpaidInvoiceIdHub = function postResumeUnpaidInvoiceIdHub(
  req,
  res,
) {
  const id = req.swagger.params.id.value;
  const { shopId, paymentType, includeCommission } =
    req.swagger.params.body.value;
  UnpaidInvoice.postResumeUnpaidInvoiceId(id, req.user, {
    shopId,
    paymentType: UnpaidInvoice.getPaymentTypeCodeById(paymentType) ?? 'CASH',
    includeCommission,
  })
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.postForceCutUnpaidInvoiceId = function postForceCutUnpaidInvoiceId(
  req,
  res,
) {
  const id = req.swagger.params.id.value;
  UnpaidInvoice.postForceCutUnpaidInvoiceId(id, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getClientStatus = function getClientStatus(req, res) {
  const id = req.swagger.params.id.value;
  UnpaidInvoice.getClientStatus(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getUnpaidInvoicesTotalAmount = function (req, res) {
  const id = req.swagger.params.id.value;
  UnpaidInvoice.getUnpaidInvoicesTotalAmount(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.clientResume = function clientResume(req, res) {
  const { unpaidInvoiceId, clientId, userId } = req.swagger.params.body.value;
  GfContractsUnpaidService.clientResume(
    clientId,
    null,
    userId,
    `UnpaidInvoice id:${unpaidInvoiceId} resume`,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.clientUnpaid = function clientUnpaid(req, res) {
  const { unpaidInvoiceId, clientId, userId } = req.swagger.params.body.value;
  GfContractsUnpaidService.clientUnpaid(
    clientId,
    null,
    null,
    null,
    null,
    userId,
    `UnpaidInvoice id:${unpaidInvoiceId} forceCut`,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
