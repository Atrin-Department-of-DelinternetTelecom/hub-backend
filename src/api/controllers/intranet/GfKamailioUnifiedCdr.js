'use strict';

const utils = require('@utils/writer');
const GfKamailioUnifiedCdr = require('@service/intranet/GfKamailioUnifiedCdrService');

module.exports.getGfKamailioUnifiedCdrs = function getGfKamailioUnifiedCdrs(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfKamailioUnifiedCdr.getGfKamailioUnifiedCdrs(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfKamailioUnifiedCdrsId = function getGfKamailioUnifiedCdrsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfKamailioUnifiedCdr.getGfKamailioUnifiedCdrsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
