'use strict';

const utils = require('@utils/writer');
const Iban = require('@service/intranet/IbanService');

module.exports.validateIban = function validateIban(req, res, next) {
  const body = req.swagger.params.body.value;

  Iban.validateIban(body.iban)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
