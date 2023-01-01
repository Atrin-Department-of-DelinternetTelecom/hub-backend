'use strict';

const utils = require('@utils/writer');
const Holidays = require('@service/hrms/HolidaysService');

module.exports.fetchHolidaysInInterval = function fetchHolidaysInInterval(
  req,
  res,
  next,
) {
  const { startTime, endTime } = req.query;

  Holidays.fetchHolidaysInInterval(startTime, endTime)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
