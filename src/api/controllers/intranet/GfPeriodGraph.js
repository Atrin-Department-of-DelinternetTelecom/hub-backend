'use strict';

const utils = require('@utils/writer');
const GfPeriodGraph = require('@service/intranet/GfPeriodGraphService');

module.exports.totalsComparativeForFront = function totalsComparativeForFront(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  const id = req.swagger.params.id.value;

  GfPeriodGraph.totalsComparativeForFront(id, req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
