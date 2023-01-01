'use strict';

const utils = require('@utils/writer');
const LandingPageService = require('@service/web/LandingPageService');
const { Parser } = require('@json2csv/plainjs');
const moment = require('moment');

module.exports.postLandingPageOrder = function postLandingPageOrder(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;

  LandingPageService.postLandingPageOrder(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLandingPageOrder = function getLandingPageOrder(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  LandingPageService.getLandingPageOrder(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.exportReferrals = function exportReferrals(req, res, next) {
  const landing = req.swagger.params.landing.value;

  LandingPageService.exportReferrals(landing)
    .then(function (referrals) {
      const parser = new Parser({
        fields: ['Name', 'Email', 'Referral Code', 'Referral Count'],
      });

      const csv = parser.parse(
        referrals.map(({ row, count }) => ({
          Name: row.name,
          Email: row.email,
          'Referral Code': row.getMetadata().referralCode,
          'Referral Count': count,
        })),
      );

      utils.writeFile(res, {
        filename: moment().toLocaleString() + '.csv',
        type: 'attachment',
        buffer: csv,
      });
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSingleLandingPageOrder = function getSingleLandingPageOrder(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  LandingPageService.getSingleLandingPageOrder(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putLandingPageOrdersId = function putLandingPageOrdersId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;

  LandingPageService.putLandingPageOrdersId(id, body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteLandingPageOrdersId = function deleteLandingPageOrdersId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  LandingPageService.deleteLandingPageOrdersId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
