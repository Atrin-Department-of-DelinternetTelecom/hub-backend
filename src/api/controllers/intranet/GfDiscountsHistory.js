'use strict';

const utils = require('@utils/writer');
const GfDiscountsHistory = require('@service/intranet/GfDiscountsHistoryService');

module.exports.getGfDiscountsHistories = function getGfDiscountsHistories(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfDiscountsHistory.getGfDiscountsHistories(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
