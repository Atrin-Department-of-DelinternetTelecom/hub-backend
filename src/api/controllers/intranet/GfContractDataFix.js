'use strict';

const utils = require('@utils/writer');
const GfContractDataFix = require('@service/intranet/GfContractDataFixService');

module.exports.getGfContractDataFixsId = function getGfContractDataFixsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfContractDataFix.getGfContractDataFixsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putGfContractDataFixsId = function putGfContractDataFixsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfContractDataFix.putGfContractDataFixsId(id, req.body, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      console.log(response);
      utils.writeJson(res, response);
    });
};
