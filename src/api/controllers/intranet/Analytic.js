'use strict';

const utils = require('@utils/writer');
const analyticService = require('@service/intranet/Analytics_IncomeBrakedownService');
const { isResponsePayload } = require('@utils/response');

module.exports.getIncomeBreakDown = function getIncomeBreakDown(
  req,
  res,
  next,
) {
  const periodId = req.swagger.params.periodId.value;
  analyticService
    .getIncomeBreakDown(periodId, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.downloadTTContribution = function downloadTTContribution(
  req,
  res,
  next,
) {
  const periodId = req.swagger.params.periodId.value;
  analyticService
    .downloadTTContribution(periodId, req.user.userId)
    .then(async function (response) {
      if (isResponsePayload(response)) {
        utils.writeJson(res, response);
      } else {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          'inline; filename=' + 'report.xlsx',
        );
        await response.xlsx.write(res);
      }
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.downloadDetails = function downloadDetails(req, res, next) {
  const periodId = req.swagger.params.periodId.value;
  analyticService
    .downloadDetails(periodId, req.user.userId)
    .then(async function (response) {
      if (isResponsePayload(response)) {
        utils.writeJson(res, response);
      } else {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          'inline; filename=' + 'detail.xlsx',
        );
        await response.xlsx.write(res);
      }
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
