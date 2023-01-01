'use strict';

const utils = require('@utils/writer');
const GfContractDataTv = require('@service/intranet/GfContractDataTvService');

module.exports.getGfContractDataTvsId = function getGfContractDataTvsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfContractDataTv.getGfContractDataTvsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      console.log(response);
      utils.writeJson(res, response);
    });
};

module.exports.putGfContractDataTvsId = function putGfContractDataTvsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfContractDataTv.putGfContractDataTvsId(id, req.body, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      console.log(response);
      utils.writeJson(res, response);
    });
};
