'use strict';

const utils = require('@utils/writer');
const DiscountMatrixRule = require('@service/intranet/GfDiscountMatrixRuleService');

module.exports.createGfDiscountsMatrixRule =
  function createGfDiscountsMatrixRule(req, res, next) {
    const body = req.swagger.params.body.value;

    DiscountMatrixRule.createGfDiscountsMatrixRule(body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getGfDiscountsMatrixRules = function getGfDiscountsMatrixRules(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  DiscountMatrixRule.getGfDiscountsMatrixRules(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfDiscountsMatrixRuleId = function getGfDiscountsMatrixRuleId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  DiscountMatrixRule.getGfDiscountsMatrixRuleId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateGfDiscountsMatrixRule =
  function updateGfDiscountsMatrixRule(req, res, next) {
    const id = req.swagger.params.id.value;

    DiscountMatrixRule.updateGfDiscountsMatrixRule(id, req.body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.deleteGfDiscountsMatrixRule =
  function deleteGfDiscountsMatrixRule(req, res, next) {
    const id = req.swagger.params.id.value;

    DiscountMatrixRule.deleteGfDiscountsMatrixRule(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
