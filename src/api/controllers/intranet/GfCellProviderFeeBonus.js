'use strict';

const utils = require('@utils/writer');
const GfCellProviderFeeBonus = require('@service/intranet/GfCellProviderFeeBonusService');

module.exports.createGfCellProviderFeeBonus =
  function createGfCellProviderFeeBonus(req, res, next) {
    const body = req.swagger.params.body.value;

    GfCellProviderFeeBonus.createGfCellProviderFeeBonus(body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getGfCellProviderFeeBonus = function getGfCellProviderFeeBonus(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfCellProviderFeeBonus.getGfCellProviderFeeBonus(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfCellProviderFeeBonusId =
  function getGfCellProviderFeeBonusId(req, res, next) {
    const id = req.swagger.params.id.value;

    GfCellProviderFeeBonus.getGfCellProviderFeeBonusId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.updateGfCellProviderFeeBonus =
  function updateGfCellProviderFeeBonus(req, res, next) {
    const id = req.swagger.params.id.value;

    GfCellProviderFeeBonus.updateGfCellProviderFeeBonus(id, req.body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.deleteGfCellProviderFeeBonus =
  function deleteGfCellProviderFeeBonus(req, res, next) {
    const id = req.swagger.params.id.value;

    GfCellProviderFeeBonus.deleteGfCellProviderFeeBonus(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
