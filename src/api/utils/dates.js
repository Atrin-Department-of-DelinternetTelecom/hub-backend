// @ts-check
'use strict';
const moment = require('moment');
const { Static } = require('@lib/cache');
const { throwUnless } = require('./helpers');

/**
 * @typedef {{ init: string, end: string, daysInMonth: number }} Month
 */

/**
 * get months with extra informatino as array of object, each object represent start of month, end of month and days of month
 * @param {moment.Moment} start moment object of start date
 * @param {moment.Moment} end moment object of end date
 * @returns {Promise<Record<string, Month>>} KEY of objects that contain init date,end date and days of related month
 */
exports.getMonths = async (start, end) => {
  //try to get this value from cache
  /** @type {Record<string, Month>} */
  let months = {};
  const cacheKey = `months-${start.format('YYYY-MM-DD HH:mm:ss')}-${end.format(
    'YYYY-MM-DD HH:mm:ss',
  )}`;
  const cacheValue = await Static.get(cacheKey);
  if (cacheValue) {
    months = JSON.parse(cacheValue ? cacheValue : '{}');
  } else {
    const startOfMonth = start.clone();
    const endOfMonth = end.clone().add('1', 'seconds');

    let startOfMonthInPeriod = null;
    for (; startOfMonth.isBefore(endOfMonth); startOfMonth.add(1, 'minute')) {
      const yearMonth = startOfMonth.format('YYYYMM');
      const month = months[yearMonth] ?? {
        init: undefined,
        end: undefined,
        daysInMonth: undefined,
      };

      if (yearMonth !== startOfMonthInPeriod) {
        month.init = startOfMonth.format('YYYY-MM-DD HH:mm:ss');
      } else {
        month.end = startOfMonth.format('YYYY-MM-DD HH:mm:59');
      }

      startOfMonthInPeriod = yearMonth;
      months[yearMonth] = month;
    }

    for (const year_month in months) {
      months[year_month].daysInMonth = moment(
        year_month,
        'YYYYMM',
      ).daysInMonth();
    }

    await Static.remember(cacheKey, JSON.stringify(months), 3600);
  }

  const returnMonth = { ...months };
  for (const yearMonth in returnMonth) {
    const value = returnMonth[yearMonth];
    if (!value.end) {
      delete returnMonth[yearMonth];
    }
  }
  return returnMonth;
};

/**
 * get longest possible between three period
 * @param {string} startDate1 start of first period
 * @param {string} endDate1 end of first period
 * @param {string} startDate2 start of second period
 * @param {string} endDate2 end of second period
 * @param {string} startDate3 start of third period
 * @param {string} endDate3 end of third peroid
 * @returns {{from:string,to:string}} period thatn containt from and to prop
 */
exports.findMinMaxBetweenThreeDates = (
  startDate1,
  endDate1,
  startDate2,
  endDate2,
  startDate3,
  endDate3,
) => {
  const start = [moment(startDate1), moment(startDate2), moment(startDate3)]
    .filter((time) => time.isValid())
    .map((filteredTime) => filteredTime.valueOf())
    .sort(function (a, b) {
      return a - b;
    });

  const end = [moment(endDate1), moment(endDate2), moment(endDate3)]
    .filter((time) => time.isValid())
    .map((filteredTime) => filteredTime.valueOf())
    .sort(function (a, b) {
      return a - b;
    });

  return {
    from: moment(start[start.length - 1]).format('YYYY-MM-DD HH:mm:ss'),
    to: moment(end[0]).format('YYYY-MM-DD HH:mm:ss'),
  };
};

/**
 * get longest possible number of days between three period
 * @param {string} startDate1 start of first period
 * @param {string} endDate1 end of first period
 * @param {string} startDate2 start of second period
 * @param {string} endDate2 end of second period
 * @param {string} startDate3 start of third period
 * @param {string} endDate3 end of third peroid
 * @returns {number} number of days
 */
exports.threeDatesDaysSwaping = (
  startDate1,
  endDate1,
  startDate2,
  endDate2,
  startDate3,
  endDate3,
) => {
  const start = [moment(startDate1), moment(startDate2), moment(startDate3)]
    .filter((time) => time.isValid())
    .map((filteredTime) => filteredTime.valueOf());

  const end = [moment(endDate1), moment(endDate2), moment(endDate3)]
    .filter((time) => time.isValid())
    .map((filteredTime) => filteredTime.valueOf());

  const min = start.sort(function (a, b) {
    return a - b;
  })[start.length - 1];
  let max = end.sort(function (a, b) {
    return a - b;
  })[0];

  if (moment(max).isDST() && !moment(min).isDST()) {
    max = moment(max).add(1, 'hours').valueOf();
  }

  if (moment(min).isDST() && !moment(max).isDST()) {
    max = moment(max).subtract(1, 'hours').valueOf();
  }

  if (min && max && min < max)
    return Number(
      moment
        .duration(moment(max).diff(moment(min)))
        .asDays()
        .toFixed(2),
    );
  //return moment.duration(moment(max).endOf('day').diff(moment(min).startOf('day')));

  return 0;
};

/**
 * get longest possible number of days between two period
 * @param {string} startDate1 start of first period
 * @param {string} endDate1 end of first period
 * @param {string} startDate2 start of second period
 * @param {string} endDate2 end of second period
 * @returns {number} number of days
 */
exports.twoDatesDaysSwaping = (startDate1, endDate1, startDate2, endDate2) => {
  const start = [moment(startDate1), moment(startDate2)]
    .filter((time) => time.isValid())
    .map((filteredTime) => filteredTime.valueOf())
    .sort(function (a, b) {
      return a - b;
    });

  const end = [moment(endDate1), moment(endDate2)]
    .filter((time) => time.isValid())
    .map((filteredTime) => filteredTime.valueOf())
    .sort(function (a, b) {
      return a - b;
    });

  if (start && end && start < end)
    return Number(
      moment
        .duration(moment(end[0]).diff(moment(start[1])))
        .asDays()
        .toFixed(2),
    );

  return 0;
};

/**
 * get days between two dates
 * @param {string} startDate start of first period
 * @param {string} endDate end of first period
 * @returns {number} number of days
 */
exports.daysBetweenTwoDates = (startDate, endDate) => {
  const start = moment(startDate);
  const end = moment(endDate);
  return Number(
    moment.duration(end.endOf('day').diff(start.startOf('day'))).asDays(),
  );
};

/**
 *
 * @param {number} seconds
 * @return {string}
 */
exports.formatTime = (seconds) => {
  const day = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const parts = [];

  if (day) {
    parts.push(`${day}d`);
  }

  if (hours) {
    parts.push(`${hours}h`);
  }
  if (minutes) {
    parts.push(`${minutes}m`);
  }
  if (remainingSeconds) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(' ');
};

/**
 *
 * @param {number} fileSizeInBytes
 * @return {string}
 */
exports.formatFileSize = (fileSizeInBytes) => {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  let size = fileSizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formattedSize = size.toFixed(2);
  const unit = units[unitIndex];

  return `${formattedSize} ${unit}`;
};

/**
 * Compare two dates (without times) using the specified operator.
 *
 * @param {string | undefined | null | Date | moment.Moment} first - The first date to compare.
 * @param {string | undefined | null | Date | moment.Moment} second - The second date to compare.
 * @param {string} operator - The comparison operator to use: '>', '<', '>=', '<=', or '='.
 * @param {boolean} [silent=false] - If true, suppresses exceptions for invalid dates and operators.
 * @returns {boolean} - True if the comparison is true, false otherwise.
 * @throws {Error} - If invalid date format (only if silent=false).
 */
exports.compareDates = (first, second, operator = '=', silent = true) => {
  const firstDate = moment(first).startOf('day');
  const secondDate = moment(second).startOf('day');

  if (!firstDate.isValid() || !secondDate.isValid()) {
    throwUnless(
      silent,
      'Invalid date format. Expected valid ISO 8601 date string or Moment object.',
    );

    return false;
  }

  switch (operator) {
    case '>':
      return firstDate.isAfter(secondDate);
    case '<':
      return firstDate.isBefore(secondDate);
    case '>=':
      return firstDate.isSameOrAfter(secondDate);
    case '<=':
      return firstDate.isSameOrBefore(secondDate);
    case '=':
      return firstDate.isSame(secondDate);
    default:
      throw new Error(
        'Invalid operator. Supported operators are: >, <, >=, <=, =',
      );
  }
};
