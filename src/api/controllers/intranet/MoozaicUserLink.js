'use strict';

const utils = require('@utils/writer');
const MoozaicUserLink = require('@service/moozaic/MoozaicUserLinkService');

module.exports.postMoozaicUserLink = function postMoozaicUserLink(
  req,
  res,
  next,
) {
  MoozaicUserLink.postMoozaicUserLink(req.query.code, req.query.state)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMoozaicUserLink = function getMoozaicUserLink(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  MoozaicUserLink.getMoozaicUserLink(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
