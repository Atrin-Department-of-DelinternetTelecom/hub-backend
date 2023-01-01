'use strict';

const utils = require('@utils/writer');
const InvoiceClientsInvoiceProfile = require('@service/intranet/InvoiceClientsInvoiceProfileService');

module.exports.deleteInvoiceClientsInvoiceProfilesId =
  function deleteInvoiceClientsInvoiceProfilesId(req, res, next) {
    const id = req.swagger.params.id.value;
    InvoiceClientsInvoiceProfile.destroyInvoiceClientsInvoiceProfilesId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getInvoiceClientsInvoiceProfiles =
  function getInvoiceClientsInvoiceProfiles(req, res, next) {
    req.query.url =
      req.protocol +
      '://' +
      req.get('host') +
      req.url.slice(0, req.url.indexOf('?'));
    InvoiceClientsInvoiceProfile.getInvoiceClientsInvoiceProfiles(req.query)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getInvoiceClientsInvoiceProfilesId =
  function getInvoiceClientsInvoiceProfilesId(req, res, next) {
    const id = req.swagger.params.id.value;
    InvoiceClientsInvoiceProfile.getInvoiceClientsInvoiceProfilesId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.postInvoiceClientsInvoiceProfiles =
  function postInvoiceClientsInvoiceProfiles(req, res, next) {
    InvoiceClientsInvoiceProfile.postInvoiceClientsInvoiceProfiles(req.body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.putInvoiceClientsInvoiceProfilesId =
  function putInvoiceClientsInvoiceProfilesId(req, res, next) {
    const id = req.swagger.params.id.value;

    InvoiceClientsInvoiceProfile.putInvoiceClientsInvoiceProfilesId(
      id,
      req.body,
    )
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
